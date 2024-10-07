import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { FAB, Provider, TouchableRipple, Chip } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import UploadModal from '../Modal/UploadModal';
import DocumentList from './DocumentList';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@env';

// 파일 크기 변환 함수
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const fileSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));

  return `${fileSize} ${sizes[i]}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    paddingHorizontal: 10,
  },
  searchIconContainer: {
    borderRadius: 100,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 55,
    backgroundColor: 'transparent',
    paddingLeft: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  chip: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
    borderWidth: 1,
    borderRadius: 25,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 16
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});

async function getCredentials() {
  const identifier = await SecureStore.getItemAsync('identifier');
  const password = await SecureStore.getItemAsync('password');
  return { identifier, password };
}

const parseSearchTerm = (searchTerm) => {
  const conditions = {};
  const regex = /(\w+):([^\s]+)/g;
  let match;

  while ((match = regex.exec(searchTerm)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2];
    conditions[key] = value;
  }

  const textSearch = searchTerm.replace(regex, '').trim();
  if (textSearch) {
    conditions.ocr_text = textSearch;
  }

  return conditions;
};

async function fetchDocuments(searchTerm) {
  const { identifier, password } = await getCredentials();
  const searchConditions = parseSearchTerm(searchTerm);

  const searchData = {
    identifier: identifier,
    password: password,
    ...searchConditions,
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
    } else {
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
        let thumbnail = null;

        if (doc.first_page_image) {
          thumbnail = `data:image/jpeg;base64,${doc.first_page_image}`;
        } else if (doc.page_image) {
          thumbnail = `data:image/jpeg;base64,${doc.page_image}`;
        }

        return {
          id: index.toString(),
          title: doc.file_name,
          extension: doc.file_extension,
          content: formattedSize,
          thumbnail: thumbnail,
          pages: doc.pdf_page_count,
          uploaddate: doc.upload_date,
          pageNumber: doc.page_number || null,
        };
      });
      setDocuments(formattedData);
    } else {
      setDocuments([]);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    const fetchedDocuments = await fetchDocuments(searchTerm);
    formatDocuments(fetchedDocuments);
    setIsSearching(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await handleSearch();
    };

    fetchData();
  }, []);

  const addTagToSearch = (tag) => {
    setSearchTerm((prev) => {
      const tagText = `${tag} `;
      if (!prev.includes(tagText)) {
        return `${prev}${tagText}`.trim();
      }
      return prev;
    });
  };

  const showModal = (modalType) => setVisibleModal(modalType);
  const hideModal = () => setVisibleModal(null);

  return (
    <Provider>
      <View style={styles.container}>
        <View style={styles.searchBarContainer}>
          <TouchableRipple
            onPress={isSearching ? null : handleSearch} // 검색 중일 땐 클릭 불가
            rippleColor="rgba(0, 0, 0, .32)"
            borderless={true}
            style={styles.searchIconContainer}
          >
            <AntDesign
              name="search1"
              size={20}
              color={isSearching ? 'lightgray' : 'gray'} // 검색 중일 때 색상 변경
              style={styles.searchIcon}
            />
          </TouchableRipple>
          <TextInput
            style={styles.searchBar}
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)} // 검색어 상태 업데이트
            underlineColorAndroid="transparent"
            placeholderTextColor="#999"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagContainer}>
          <Chip style={styles.chip} textStyle={styles.chipText} onPress={() => addTagToSearch('upload:20240101')}>upload:20240101</Chip>
          <Chip style={styles.chip} textStyle={styles.chipText} onPress={() => addTagToSearch('filetype:pdf')}>filetype:pdf</Chip>
          <Chip style={styles.chip} textStyle={styles.chipText} onPress={() => addTagToSearch('pages:>15')}>pages:&gt;15</Chip>
          <Chip style={styles.chip} textStyle={styles.chipText} onPress={() => addTagToSearch('size:<5MB')}>size:&lt;5MB</Chip>
          <Chip style={styles.chip} textStyle={styles.chipText} onPress={() => addTagToSearch('filename:report')}>filename:report</Chip>
        </ScrollView>

        {isSearching ? (
          <ActivityIndicator size="large" color="#1e90ff" />
        ) : (
          <DocumentList documents={documents} />
        )}
        
        <UploadModal visible={visibleModal === 'upload'} hideModal={hideModal} />
        <FAB.Group
          open={open}
          icon={open ? 'close' : 'plus'}
          actions={[
            {
              icon: 'upload',
              label: '파일 업로드',
              onPress: () => showModal('upload'),
            },
          ]}
          onStateChange={({ open }) => setOpen(open)}
        />
      </View>
    </Provider>
  );
};

export default HomeScreen;
