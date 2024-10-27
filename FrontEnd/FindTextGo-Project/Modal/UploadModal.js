// UploadModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Text, Portal } from 'react-native-paper';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@env'; // .env에서 API_BASE_URL 불러오기
import axios from 'axios';

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  fileDropArea: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
  },
  fileInfoContainer: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  fileInfo: {
    fontSize: 16,
    color: '#1f2937',
    marginTop: 10,
    fontWeight: '500',
  },
  link: {
    color: '#3b82f6',
    fontWeight: 'bold',
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
  errorMessage: {
    color: 'red',
    marginTop: 10,
  },
});

const UploadModal = ({ visible, hideModal }) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });

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

  // 자격증명 불러오기
  useEffect(() => {
    const fetchCredentials = async () => {
      const identifier = await SecureStore.getItemAsync('identifier');
      const password = await SecureStore.getItemAsync('password');
      setCredentials({ identifier, password });
    };
    fetchCredentials();
  }, []);

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
    if (!credentials.identifier || !credentials.password) {
      setErrorMessage('로그인 정보를 불러올 수 없습니다.');
      return;
    }
  
    const uploadData = {
      identifier: credentials.identifier,
      password: credentials.password,
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
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modalContent}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="folder" size={40} color="#3b82f6" />
        </View>
        <Text style={styles.title}>문서 업로드</Text>
        <Text style={styles.description}>
          PDF, Word, 한글(HWP), PPTX, 엑셀 파일을 업로드해주세요.
        </Text>

        <TouchableOpacity style={styles.fileDropArea} onPress={pickDocument}>
          <MaterialIcons name="cloud-upload" size={40} color="#3b82f6" />
          <Text style={{ marginTop: 10 }}>여기에 파일을 드래그하거나 클릭하여 파일을 선택하세요</Text>
        </TouchableOpacity>

        {/* 파일이 선택되면 파일 이름 및 형식 표시 */}
        {selectedFile && (
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileInfo}>
              선택된 파일: {selectedFile.name}
            </Text>
          </View>
        )}

        {/* 에러 메시지 */}
        {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={handleClose} style={styles.cancelButton}>
            취소
          </Button>
          <Button
            mode="contained"
            onPress={handleFileUpload} // 파일 업로드 처리
            style={styles.uploadButton}
            disabled={!selectedFile} // 파일이 없을 경우 버튼 비활성화
          >
            파일 업로드
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

export default UploadModal;


