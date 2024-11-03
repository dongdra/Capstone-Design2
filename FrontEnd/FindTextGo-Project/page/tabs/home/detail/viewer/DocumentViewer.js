// DocumentViewer.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { API_BASE_URL } from '@env';
import axios from 'axios'; 
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { addLog } from '../../../../../logService';

const styles = StyleSheet.create({
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    marginBottom: 9,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#536ed9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  boundingBox: {
    position: 'absolute',
    borderColor: 'red',
    borderWidth: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

async function getCredentials() {
  const identifier = await SecureStore.getItemAsync('identifier');
  const password = await SecureStore.getItemAsync('password');
  return { identifier, password };
}

const DocumentViewer = ({ route }) => {
  const { documentId, documentPage, fileName } = route.params;
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [coordinatesList, setCoordinatesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const isMounted = useRef(true);
  const imageRef = useRef(null);
  
  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        await addLog(`${fileName} 문서에 접속했습니다.`);
      };
      logVisit();
    }, [fileName])
  );

  // 이미지 불러오기 함수
  const fetchImages = async () => {
    try {
      let imageList = [];
      for (let pageNumber = 1; pageNumber <= documentPage; pageNumber++) {
        const imageUrl = `${API_BASE_URL}/documents/${documentId}/${pageNumber}.png`;
  
        const response = await axios.get(imageUrl, { responseType: 'blob' });
  
        if (response.status === 200 && isMounted.current) {
          imageList.push({ url: imageUrl });
        } else {
          //console.warn(`페이지 ${pageNumber}에 해당하는 이미지를 찾을 수 없습니다.`);
        }
      }
  
      if (isMounted.current) {
        setImages(imageList);
        setLoading(false);
      }
    } catch (error) {
      console.error('이미지 로드 중 오류 발생:', error);
    }
  };
  
  // OCR 검색 함수
  const searchOCR = async () => {
    try {
      const { identifier, password } = await getCredentials(); // 인증 정보 가져오기
  
      const response = await axios.post(`${API_BASE_URL}/search/api.php`, {
        identifier,
        password,
        search_term: `'text:'${searchTerm}'`,
        document_id: documentId,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      const data = response.data;
  
      if (data.StatusCode === 200 && data.data.length > 0) {
        const allCoordinates = data.data
          .filter(result => result.file_id === documentId)
          .flatMap(result =>
            result.ocr_results.map(ocr => ({
              ...ocr.coordinates,
              pageNumber: ocr.page_number - 1,
            }))
          );
  
        if (allCoordinates.length > 0) {
          setCoordinatesList(allCoordinates);
          setCurrentIndex(allCoordinates[0].pageNumber);
        } else {
          Alert.alert('검색 실패', '검색 결과가 없습니다.');
        }
      } else {
        Alert.alert('검색 실패', '검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('OCR 검색 중 오류 발생:', error);
      Alert.alert('오류', '검색 요청에 실패했습니다.');
    }
  };


  // 이미지 로드 시 원본 해상도 감지
  const handleImageLoad = (event) => {
    const { width, height } = event.nativeEvent.source;
    setOriginalSize({ width, height });
  };

  // 좌표 조정 함수
  const getAdjustedCoordinates = (coord, originalWidth, originalHeight, displayWidth, displayHeight) => {
    const scaleX = displayWidth / originalWidth;  // X축 배율 계산
    const scaleY = displayHeight / originalHeight;  // Y축 배율 계산
  
    // 2배로 줄인 좌표 계산
    const reducedX = coord.x / 2;
    const reducedY = coord.y / 2;
    const reducedWidth = coord.width / 1.5;
    const reducedHeight = coord.height / 1.5;
  
    // 조정된 좌표 반환 (여백 보정 필요 시 추가 가능)
    return {
      x: reducedX * scaleX,  // 조정된 X 좌표
      y: reducedY * scaleY,  // 조정된 Y 좌표
      width: reducedWidth * scaleX,  // 조정된 너비
      height: reducedHeight * scaleY,  // 조정된 높이
    };
  };
  
  const renderBoundingBoxes = () => {
    return coordinatesList
      .filter(coord => coord.pageNumber === currentIndex)  // 현재 페이지의 좌표만 필터링
      .map((coord, index) => {
        const { x, y, width, height } = getAdjustedCoordinates(
          coord,
          originalSize.width,  // 원본 이미지의 너비
          originalSize.height,  // 원본 이미지의 높이
          imageRef.current?.width || 1,  // 화면에 표시된 이미지의 너비
          imageRef.current?.height || 1  // 화면에 표시된 이미지의 높이
        );
  
        return (
          <View
            key={index}
            style={[
              styles.boundingBox,
              { top: y, left: x, width, height }  // 조정된 좌표로 경계 상자 렌더링
            ]}
          />
        );
      });
  };
  // 마운트 상태 관리
  useEffect(() => {
    isMounted.current = true;
    fetchImages();

    return () => {
      isMounted.current = false;
    };
  }, [documentId, documentPage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.input}
          placeholder="검색어를 입력하세요"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchOCR}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
       <View style={styles.loaderContainer}>
       <ActivityIndicator size="large" color="#6200ee" />
       <Text>로딩 중...</Text>
     </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ImageViewer
            imageUrls={images}
            enableSwipeDown={true}
            index={currentIndex}
            onChange={setCurrentIndex}
            renderImage={(props) => (
              <View
                style={styles.imageContainer}
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  imageRef.current = { width, height };
                }}
              >
                <Image
                  {...props}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  onLoad={handleImageLoad}
                />
                {renderBoundingBoxes()}
              </View>
            )}
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
};



export default DocumentViewer;