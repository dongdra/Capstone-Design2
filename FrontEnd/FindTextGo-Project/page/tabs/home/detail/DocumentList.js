// DocumentList.js
import React, { useState, useCallback, useContext, useEffect } from 'react';
import { View, FlatList, Image, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SummaryModal from './summary/SummaryModal';
import KeywordLocationModal from './keyword/KeywordLocationModal';
import { API_BASE_URL } from '@env';
import { addFavorite, removeFavorite, getFavorites } from '../../../../favoriteService';
import { DataContext } from '../../../../DataContext';
import axios from 'axios';

const styles = {
  card: {
    marginVertical: 5,
    borderWidth: 1,
    borderRadius: 8,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageContainer: {
    padding: 10,
    flex: 1,
    marginRight: 15,
  },
  CardthumbnailImage: {
    width: '120%',
    height: 200,
    borderWidth: 1,
  },
  defaultImage: {
    width: '120%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultImageText: {
    fontSize: 14,
  },
  CardTitleText: {
    marginLeft: 15,
    marginTop: 18,
    fontSize: 14,
    fontWeight: 'bold',
  },
  CardDateText: {
    marginLeft: 15,
    marginTop: 10,
    fontSize: 14,
  },
  CardStorageText: {
    marginLeft: 15,
    marginTop: 10,
    fontSize: 14,
  },
  CardTypeText: {
    marginLeft: 3,
    fontSize: 13,
  },
  CardPageText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
  },
  CardInfoRow: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
}

const DocumentList = ({ documents }) => {
  const { identifier, password, isDarkThemeEnabled } = useContext(DataContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const [keywordModalVisible, setKeywordModalVisible] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const navigation = useNavigation();
  const [favoriteStatus, setFavoriteStatus] = useState({}); // 문서별 즐겨찾기 상태

  useEffect(() => {
    const loadFavorites = async () => {
      if (!identifier) return;

      try {
        const favorites = await getFavorites(identifier);
        const status = favorites.reduce((acc, doc) => {
          acc[doc.id] = true; // 즐겨찾기에 포함된 문서의 상태를 true로 설정
          return acc;
        }, {});
        setFavoriteStatus(status);
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    };

    loadFavorites();
  }, [identifier]);

  const toggleFavorite = useCallback(async (documentId, documentTitle, documentPage) => {
    if (!identifier) {
      console.error("Identifier is required to toggle favorite.");
      return;
    }

    try {
      const favorites = await getFavorites(identifier);
      const isFavorite = favorites.some((doc) => doc.id === documentId);

      if (isFavorite) {
        await removeFavorite(identifier, documentId);
        setFavoriteStatus((prevStatus) => ({ ...prevStatus, [documentId]: false })); // 상태 업데이트
      } else {
        await addFavorite(identifier, documentId, documentTitle, documentPage);
        setFavoriteStatus((prevStatus) => ({ ...prevStatus, [documentId]: true })); // 상태 업데이트
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, [identifier]);


  const fetchSummary = useCallback(async (fileId) => {
    if (!identifier || !password) {
      Alert.alert('오류', '로그인 정보를 불러올 수 없습니다.');
      return;
    }

    setModalVisible(true);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/summary/api.php`, {
        identifier,
        password,
        file_id: fileId,
      });

      const data = response.data;
      if (data.StatusCode === 200) {
        setSummary(data.data.summary);
      } else {
        Alert.alert('오류', data.message || '요약을 불러오지 못했습니다.');
      }
    } catch (error) {
      console.error('네트워크 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [identifier, password]);

  const deleteDocument = useCallback((uploadId) => {
    Alert.alert(
      '파일 삭제',
      '파일을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!identifier || !password) {
                Alert.alert('오류', '로그인 정보를 불러올 수 없습니다.');
                return;
              }

              const deleteData = {
                identifier,
                password,
                upload_id: uploadId,
              };

              console.log("전송할 JSON 데이터:", JSON.stringify(deleteData));

              const response = await axios.post(`${API_BASE_URL}/search/delete.php`, deleteData);

              if (response.status === 200) {
                Alert.alert('성공', '파일이 삭제되었습니다.');
              } else if (response.status === 404) {
                const errorMessage = response.data?.message || '해당 파일을 찾을 수 없습니다.';
                Alert.alert('오류', errorMessage);
              } else {
                throw new Error(`서버 오류: ${response.status}`);
              }
            } catch (error) {
              console.error('파일 삭제 오류:', error);
              Alert.alert('오류', '파일을 삭제하지 못했습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [identifier, password]);


  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('DocumentViewer', {
        fileName: item.title,
        documentId: item.id,
        documentPage: item.pages,
      })}
    >
      <Card style={[
        styles.card,
        { backgroundColor: isDarkThemeEnabled ? '#444' : '#ffffff', borderColor: isDarkThemeEnabled ? '#555' : '#ddd' }
      ]}>
        <View style={styles.contentRow}>
          <View style={styles.imageContainer}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={[styles.CardthumbnailImage, { borderColor: isDarkThemeEnabled ? '#555' : '#ddd' }]} />
            ) : (
              <View style={styles.defaultImage}>
                <Text style={[styles.defaultImageText, { color: isDarkThemeEnabled ? '#bbb' : '#999' }]}>No Image</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'column', flex: 2 }}>
            <Text style={[styles.CardTitleText, { color: isDarkThemeEnabled ? '#fff' : '#222' }]}>{item.title}</Text>
            <Text style={[styles.CardDateText, { color: isDarkThemeEnabled ? '#bbb' : '#848484' }]}>날짜: {item.uploaddate}</Text>
            <Text style={[styles.CardStorageText, { color: isDarkThemeEnabled ? '#bbb' : '#848484' }]}>용량: {item.content}</Text>
          </View>
        </View>
        <Divider style={[styles.divider, { backgroundColor: isDarkThemeEnabled ? '#666' : '#ccc' }]} />
        <View style={styles.CardInfoRow}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={[styles.CardTypeText, { color: isDarkThemeEnabled ? '#bbb' : '#848484' }]}>{item.extension}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.CardPageText, { color: isDarkThemeEnabled ? '#bbb' : '#848484' }]}>{item.pages}P</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
            {item.ocr_results && item.ocr_results.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedLocations(item.ocr_results);
                  setKeywordModalVisible(true);
                }}
                style={{ marginRight: 20 }}
              >
                <Feather name="info" size={24} color={isDarkThemeEnabled ? '#ddd' : 'black'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => fetchSummary(item.id)} style={{ marginRight: 20 }}>
              <Feather name="file-text" size={24} color={isDarkThemeEnabled ? '#ddd' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteDocument(item.uploadid)} style={{ marginRight: 20 }}>
              <Feather name="trash-2" size={24} color={isDarkThemeEnabled ? '#ddd' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavorite(item.id, item.title, item.pages)}>
              <Feather name="star" size={24} color={favoriteStatus[item.id] ? '#FFD700' : 'black'} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <>
      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      <SummaryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        summary={summary}
        isLoading={isLoading} // 로딩 상태 전달
      />
      <KeywordLocationModal
        visible={keywordModalVisible}
        onClose={() => setKeywordModalVisible(false)}
        ocrResults={selectedLocations}
      />
    </>
  );
};

export default DocumentList;
