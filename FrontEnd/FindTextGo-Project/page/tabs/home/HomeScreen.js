//HomeScreen.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, StyleSheet, TextInput, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { FAB, Provider, TouchableRipple } from 'react-native-paper';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import UploadModal from './upload/UploadModal';
import FilterDialog from './filter/FilterDialog';
import DocumentList from './detail/DocumentList';
import { API_BASE_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import { addLog } from '../../../logService';
import axios from 'axios';
import { DataContext } from '../../../DataContext';



const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const parseSearchTerm = (searchTerm) => searchTerm.trim();

async function fetchDocuments(identifier, password, searchTerm) {
  const formattedSearchTerm = parseSearchTerm(searchTerm);

  const searchData = { identifier, password, search_term: formattedSearchTerm };

  console.log('전송하는 JSON 데이터:', JSON.stringify(searchData));

  try {
    const response = await axios.post(`${API_BASE_URL}/search/api.php`, searchData, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data.StatusCode === 200) {
      return { data: response.data.data, status: 200 };
    } else {
      return { data: [], status: response.data.StatusCode };
    }
  } catch (error) {
    console.error('문서 검색 중 오류 발생:', error);
    return { data: [], status: 500 };
  }
}

const HomeScreen = () => {
  const { identifier, password, isDarkThemeEnabled } = useContext(DataContext);
  const [documents, setDocuments] = useState([]);
  const [open, setOpen] = useState(false);
  const [visibleModal, setVisibleModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const clearSearch = () => setSearchTerm('');

  const applyFiltersToSearch = (filters) => {
    let appliedFilters = '';
    if (filters.uploadDate?.startDate && filters.uploadDate?.endDate) {
      appliedFilters += `upload:${filters.uploadDate.startDate.toLocaleDateString()}~${filters.uploadDate.endDate.toLocaleDateString()} `;
    }
    if (filters.singleDate) {
      appliedFilters += `${filters.singleDate.toLocaleDateString()} `;
    }
    if (filters.fileType) { // 단일 값으로 처리
      appliedFilters += `${filters.fileType} `;
    }
    setSearchTerm(appliedFilters.trim());
  };

  const formatDocuments = (fetchedDocuments) => {
    const formattedData = fetchedDocuments.map((doc) => ({
      uploadid: doc.upload_id,
      id: doc.file_id,
      title: doc.file_name,
      extension: doc.file_extension,
      content: formatFileSize(doc.file_size),
      thumbnail: doc.first_page_image
        ? `data:image/jpeg;base64,${doc.first_page_image}`
        : doc.page_image
          ? `data:image/jpeg;base64,${doc.page_image}`
          : null,
      pages: doc.pdf_page_count,
      uploaddate: doc.upload_date,
      pageNumber: doc.page_number || null,
      ocr_results: doc.ocr_results || [],
    }));
    setDocuments(formattedData);
  };

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchError(null);
    const result = await fetchDocuments(identifier, password, searchTerm);

    if (result.status === 404) {
      setSearchError('검색 결과가 없습니다.');
      setDocuments([]);
    } else if (result.status === 200) {
      formatDocuments(result.data);
    } else {
      setSearchError('오류가 발생했습니다. 나중에 다시 시도해주세요.');
    }
    setIsSearching(false);
  }, [identifier, password, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await handleSearch();
    setIsRefreshing(false);
  };


  useEffect(() => {
    handleSearch();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        if (!identifier) {
          console.error("Identifier is required to add a log.");
          return;
        }
        await addLog(identifier, '홈 페이지에 접속했습니다.');
      };
      logVisit();
    }, [identifier])
  );

  

  const showModal = (modalType) => {
    if (modalType === 'upload' && identifier) {
      addLog(identifier, '업로드 페이지에 접속했습니다.'); // 업로드 모달 로그 추가
    }
    setVisibleModal(modalType);
  };

  const hideModal = () => setVisibleModal(null);

  return (
    <Provider>
      <View style={[
        styles.container,
        { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' }
      ]}>
        <View style={[
          styles.searchBarContainer,
          { backgroundColor: isDarkThemeEnabled ? '#444' : '#fff', borderColor: isDarkThemeEnabled ? '#555' : '#6E6E6E' }
        ]}>
          <TouchableRipple onPress={isSearching ? null : handleSearch} rippleColor="rgba(0, 0, 0, .32)" borderless>
            <AntDesign name="search1" size={20} color={isDarkThemeEnabled ? 'lightgray' : 'gray'} style={styles.SearchIcon} />
          </TouchableRipple>
          <TextInput
            style={[styles.HomeTextInput, { color: isDarkThemeEnabled ? '#ddd' : '#000' }]}
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChangeText={setSearchTerm}
            underlineColorAndroid="transparent"
            placeholderTextColor={isDarkThemeEnabled ? '#aaa' : '#999'}
          />
          {searchTerm.length > 0 && (
            <TouchableRipple onPress={clearSearch}>
              <MaterialIcons name="close" size={26} color={isDarkThemeEnabled ? '#ddd' : 'gray'} style={{ marginRight: 10 }} />
            </TouchableRipple>
          )}
          <TouchableRipple onPress={() => setShowFilterDialog(true)}>
            <MaterialIcons name="filter-list" size={26} color={isDarkThemeEnabled ? '#ddd' : 'gray'} />
          </TouchableRipple>
        </View>

        <FilterDialog visible={showFilterDialog} onDismiss={() => setShowFilterDialog(false)} onApply={applyFiltersToSearch} />

        {isSearching ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={{ color: isDarkThemeEnabled ? '#fff' : '#000' }}>로딩 중...</Text>
          </View>
        ) : (
          <>
            {searchError && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: isDarkThemeEnabled ? '#bbb' : '#666' }]}>
                  {searchError}
                </Text>
              </View>
            )}
            <FlatList
              data={documents}
              renderItem={({ item }) => <DocumentList documents={[item]} />}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            />
          </>
        )}

        <UploadModal visible={visibleModal === 'upload'} hideModal={hideModal} />

        <FAB
  icon="upload"
  onPress={() => showModal('upload')} // 누르면 바로 UploadModal 호출
  style={{
    backgroundColor: isDarkThemeEnabled ? '#333' : '#fff',
    borderWidth: 1,
    position: 'absolute',
    bottom: 16,
    right: 16,
  }}
  color={isDarkThemeEnabled ? '#fff' : '#333'} // 다크모드에 따라 아이콘 색상 설정
/>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 4,
  },
  SearchIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  HomeTextInput: {
    flex: 1,
    height: 55,
    backgroundColor: 'transparent',
    paddingLeft: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default HomeScreen;
