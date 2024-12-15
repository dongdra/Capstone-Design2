// UploadModal.js
import React, { useState, useCallback, useContext } from 'react';
import { Modal, Button, Text, Portal } from 'react-native-paper';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '@env'; 
import axios from 'axios';
import { DataContext } from '../../../../DataContext';

const UploadModal = ({ visible, hideModal, onUploadSuccess  }) => {
  const { identifier, password, isDarkThemeEnabled } = useContext(DataContext); 
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // 허용하는 파일 형식 (이미지 제외)
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/haansofthwp',
  ];


  // 파일 선택 핸들러
  const pickDocument = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({});

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const { name, mimeType, uri } = file;

        // 허용된 파일 형식인지 확인
        if (allowedFileTypes.includes(mimeType)) {
          const fileBase64 = await convertToBase64(uri);
          setSelectedFile({ name, mimeType, fileBase64 });
          setErrorMessage(''); // 오류 메시지 초기화
        } else {
          setErrorMessage('PDF, Word, 한글(HWP), ZIP 파일만 업로드할 수 있습니다.');
          setSelectedFile(null); // 잘못된 파일 초기화
        }
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('파일 선택 실패:', err);
      setErrorMessage('파일 선택에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 파일을 Base64로 변환하는 함수
const convertToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1]; // Base64 부분만 추출
        console.log("Base64 변환 완료:", base64Data.slice(0, 50) + '...'); // 첫 50자만 로그에 출력
        resolve(base64Data);
      };
      reader.onerror = (error) => {
        console.error("Base64 변환 실패:", error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("파일을 Base64로 변환 중 오류 발생:", error);
    throw error;
  }
};


  // 파일 업로드 핸들러
  const handleFileUpload = async () => {
    if (!identifier || !password) { // identifier와 password 직접 사용
      setErrorMessage('로그인 정보를 불러올 수 없습니다.');
      return;
    }
  
    const uploadData = {
      identifier,
      password,
      file_base64: selectedFile.fileBase64,
      filename: selectedFile.name || 'noname.pdf',
    };
  
    console.log("파일 업로드 전송 데이터:", JSON.stringify(uploadData));
  
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/upload.php`, uploadData, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      const data = response.data; // 응답 데이터를 바로 가져오기
  
      if (data.StatusCode === 200) {
        console.log('파일 업로드 성공:', data.message);
        Alert.alert('성공', '파일이 성공적으로 업로드되었습니다.');
        setSelectedFile(null);
        hideModal();
        await onUploadSuccess(); 
      } else {
        console.log('파일 업로드 실패:', data.message);
        Alert.alert('업로드 실패', '파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      Alert.alert("업로드 실패", "파일 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };


  // 모달을 닫을 때 상태 초기화
  const handleClose = () => {
    setSelectedFile(null); // 선택된 파일 초기화
    setErrorMessage(''); // 에러 메시지 초기화
    hideModal(); // 모달 숨김
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={[
        styles.modalContent,
        { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' }
      ]}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: isDarkThemeEnabled ? '#444' : '#eef2ff' }
        ]}>
          <MaterialIcons name="folder" size={40} color={isDarkThemeEnabled ? '#fff' : '#3b82f6'} />
        </View>
        <Text style={[
          styles.title,
          { color: isDarkThemeEnabled ? '#fff' : '#333' }
        ]}>문서 업로드</Text>
        <Text style={[
          styles.description,
          { color: isDarkThemeEnabled ? '#ccc' : '#666' }
        ]}>
          PDF, Word, 한글(HWP), PPTX, 엑셀 파일을 업로드해주세요.
        </Text>

        <TouchableOpacity style={[
          styles.fileDropArea,
          { borderColor: isDarkThemeEnabled ? '#555' : '#cfcfcf' }
        ]} onPress={pickDocument}>
          <MaterialIcons name="cloud-upload" size={40} color={isDarkThemeEnabled ? '#bbb' : '#3b82f6'} />
          <Text style={{ marginTop: 10, color: isDarkThemeEnabled ? '#bbb' : '#000' }}>
            여기에 파일을 드래그하거나 클릭하여 파일을 선택하세요
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={[
            styles.fileInfoContainer,
            { backgroundColor: isDarkThemeEnabled ? '#555' : '#f1f5f9' }
          ]}>
            <Text style={[
              styles.fileInfo,
              { color: isDarkThemeEnabled ? '#eee' : '#1f2937' }
            ]}>
              선택된 파일: {selectedFile.name}
            </Text>
          </View>
        )}

        {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={handleClose} style={[
            styles.cancelButton,
            { borderColor: isDarkThemeEnabled ? '#777' : '#ccc', color: isDarkThemeEnabled ? '#bbb' : '#000' }
          ]}>
            취소
          </Button>
          <Button
            mode="contained"
            onPress={handleFileUpload}
            style={[
              styles.uploadButton,
              { backgroundColor: isDarkThemeEnabled ? '#666' : '#3b82f6' }
            ]}
            disabled={!selectedFile}
          >
            파일 업로드
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  fileDropArea: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
  },
  fileInfoContainer: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  fileInfo: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  errorMessage: {
    color: 'red',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    borderColor: '#ccc',
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
  },
});

export default UploadModal;


