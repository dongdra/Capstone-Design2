// HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB, Provider, TextInput, Button } from 'react-native-paper';
import UploadModal from '../Modal/UploadModal';
import DocumentList from './DocumentList';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@env'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#536ed9',
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});

// 파일 크기 변환 함수
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const fileSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
  
  return `${fileSize} ${sizes[i]}`;
};

async function getCredentials() {
  const identifier = await SecureStore.getItemAsync('identifier');
  const password = await SecureStore.getItemAsync('password');
  return { identifier, password };
}

async function fetchDocuments(searchTerm) {
  const { identifier, password } = await getCredentials();

  const searchData = {
    identifier: identifier,
    password: password,
    search_term: searchTerm,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/search/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    const data = await response.json();

    if (data.StatusCode === 200) {
      return data.data;
    } 
    else 
    {
      return [];
    }
  } catch (error) {
    return [];
  }
}

const HomeScreen = () => {
  const [documents, setDocuments] = useState([]);
  const [open, setOpen] = useState(false);
  const [visibleModal, setVisibleModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const formatDocuments = (fetchedDocuments) => {
    if (fetchedDocuments && fetchedDocuments.length > 0) {
      const formattedData = fetchedDocuments.map((doc, index) => {
        const formattedSize = formatFileSize(doc.file_size);
        console.log('Original file size:', doc.file_size); // 원래 파일 크기 출력
        console.log('Formatted file size:', formattedSize); // 변환된 파일 크기 출력

        return {
          id: index.toString(),
          title: doc.file_name,
          extenstion: doc.file_extension,
          content: formattedSize, 
          thumbnail: doc.first_page_image
            ? `data:image/jpeg;base64,${doc.first_page_image}`
            : null,
          pages: doc.pdf_page_count,
          uploaddate: doc.upload_date
        };
      });
      setDocuments(formattedData);
    } else {
      setDocuments([]);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    const fetchedDocuments = await fetchDocuments(searchTerm); // 검색어 포함
    formatDocuments(fetchedDocuments);
    setIsSearching(false);
  };

  const showModal = (modalType) => setVisibleModal(modalType);
  const hideModal = () => setVisibleModal(null);

  return (
    <Provider>
      <View style={styles.container}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChangeText={setSearchTerm}
            mode="outlined"
          />
          <Button
            mode="contained"
            style={styles.searchButton}
            onPress={handleSearch}
            loading={isSearching}
            disabled={isSearching}
          >
            검색
          </Button>
        </View>
        <DocumentList documents={documents} />
        <UploadModal visible={visibleModal === 'upload'} hideModal={hideModal} />
        <FAB.Group
          open={open}
          icon={open ? 'close' : 'plus'}
          actions={[
            {
              icon: 'upload',
              label: '파일 업로드',
              onPress: () => showModal('upload'),
            }
          ]}
          onStateChange={({ open }) => setOpen(open)}
        />
      </View>
    </Provider>
  );
};

export default HomeScreen;
