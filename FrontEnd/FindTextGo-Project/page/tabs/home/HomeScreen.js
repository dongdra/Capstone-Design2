import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, StyleSheet, TextInput, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { FAB, Provider, TouchableRipple } from 'react-native-paper';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import UploadModal from './upload/UploadModal';
import DocumentList from './detail/DocumentList';
import { API_BASE_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { addLog } from '../../../logService';
import axios from 'axios';
import { DataContext } from '../../../DataContext';
import { DatePickerModal, registerTranslation } from 'react-native-paper-dates';
import { ko } from 'react-native-paper-dates';

registerTranslation('ko', ko);

const formatFileSize = (bytes) => {
  if (bytes < 0) throw new Error("File size cannot be negative.");
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;

  while (bytes >= 1024 && index < sizes.length - 1) {
    bytes /= 1024; // 나누기 연산으로 크기 변환
    index++;
  }

  // 소수점 두 자리까지 자르기
  return `${bytes.toFixed(2)} ${sizes[index]}`;
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
  const [visibleModal, setVisibleModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [items, setItems] = useState([
    { label: '전체 선택', value: '0' },
    { label: '업로드 날짜', value: '1' },
    { label: '파일타입 검색', value: '2' },
    { label: '페이지수 검색', value: '3' },
    { label: '파일명 검색', value: '4' },
    { label: '파일크기 검색', value: '5' },
    { label: '내용 검색', value: '6' },

  ]);
  const [datePickerVisible, setDatePickerVisible] = useState(false); // DatePicker visibility
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [isTextSearch, setIsTextSearch] = useState(false);

  const handleDropdownChange = (value) => {
    setSelectedValue(value);
    setIsTextSearch(value === '6'); // '내용 검색'일 때만 true로 설정
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDateRange({ startDate: null, endDate: null }); // 날짜 범위 초기화
  };

  const showModal = (modalType) => {
    setVisibleModal(modalType);
  };

  const formatDocuments = (fetchedDocuments) => {
    const formattedData = fetchedDocuments.map((doc) => ({
      uploadid: doc.upload_id,
      id: doc.file_id,
      title: doc.file_name,
      extension: doc.file_extension,
      content: formatFileSize(doc.file_size),
      originalSize: `${doc.file_size}`,

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

    let formattedSearchTerm = '';

    if (selectedValue) {
      switch (selectedValue) {
        case '0': // 전체 선택
          formattedSearchTerm = ''; // 검색어를 비워 전체 검색
          break;
        case '1': // 업로드 날짜 검색
          if (searchTerm.match(/^\d{8}$/)) {
            // 사용자가 텍스트 입력으로 단일 날짜를 입력한 경우
            formattedSearchTerm = `upload:${searchTerm}`;
          } else if (dateRange.startDate) {
            // 사용자가 DatePicker로 날짜를 선택한 경우
            formattedSearchTerm = dateRange.endDate
              ? `upload:${dateRange.startDate}-${dateRange.endDate}` // 범위 검색
              : `upload:${dateRange.startDate}`; // 단일 날짜 검색
          } else {
            setIsSearching(false);
            return;
          }
          break;
        case '2': // 파일타입 검색
          formattedSearchTerm = `filetype:${searchTerm}`;
          break;
        case '3': // 페이지수 검색
          formattedSearchTerm = `pages:${searchTerm}`;
          break;
        case '4': // 파일명 검색
          formattedSearchTerm = `filename:'${searchTerm}'`;
          break;
        case '5': // 파일크기 검색 
          formattedSearchTerm = `size:${searchTerm}`; // 변환된 값 서버에 전송
          break;
        case '6': // 내용 검색
          formattedSearchTerm = `text:'${searchTerm}'`;
          break;
        default:
          break;
      }
    }

    const result = await fetchDocuments(identifier, password, formattedSearchTerm);

    if (result.status === 200) {
      formatDocuments(result.data);

    } else if (result.status === 404) {
      setSearchError('검색 결과가 없습니다.');
      setDocuments([]);

    } else {
      setSearchError('오류가 발생했습니다. 나중에 다시 시도해주세요.');
    }
    setIsSearching(false);
  }, [identifier, password, searchTerm, selectedValue, dateRange]);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    await handleSearch();
    setIsRefreshing(false);
  };


  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    console.log(`isTextSearch 상태 변경: ${isTextSearch}`);
  }, [isTextSearch]);

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

  const showDatePicker = () => setDatePickerVisible(true);

  const onDateConfirm = ({ startDate, endDate }) => {
    const formatToDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (`0${d.getMonth() + 1}`).slice(-2);
      const day = (`0${d.getDate()}`).slice(-2);
      return `${year}${month}${day}`;
    };

    const formattedStartDate = startDate ? formatToDate(startDate) : '';
    const formattedEndDate = endDate ? formatToDate(endDate) : '';

    if (formattedStartDate && formattedEndDate) {
      setSearchTerm(`${formattedStartDate}-${formattedEndDate}`); // 범위 날짜 표시
    } else if (formattedStartDate) {
      setSearchTerm(formattedStartDate); // 단일 날짜 표시
    }

    setDateRange({ startDate: formattedStartDate, endDate: formattedEndDate });
    setDatePickerVisible(false);
  };

  const hideModal = () => setVisibleModal(null);

  return (
    <Provider>
      <View style={[
        styles.container,
        { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' }
      ]}>
        <View style={styles.dropdownandsearchContainer}>
          <View style={styles.dropdownContainer}>
            <DropDownPicker
              open={open}
              value={selectedValue}
              items={items}
              setOpen={setOpen}
              setValue={(callback) => {
                const value = typeof callback === 'function' ? callback(selectedValue) : callback;
                handleDropdownChange(value); // 상태 업데이트
              }}
              setItems={setItems}
              placeholder="검색 선택"
              placeholderStyle={{
                color: isDarkThemeEnabled ? '#aaa' : '#999',
                textAlign: 'center',
              }}
              style={[
                styles.dropdown,
                {
                  backgroundColor: isDarkThemeEnabled ? '#444' : '#fff',
                  borderColor: isDarkThemeEnabled ? '#555' : '#6E6E6E',
                },
              ]}
              textStyle={{
                fontSize: 12,
                textAlign: 'center',
                color: isDarkThemeEnabled ? '#fff' : '#000',
              }}
            />
          </View>
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
              onSubmitEditing={handleSearch}
              underlineColorAndroid="transparent"
              placeholderTextColor={isDarkThemeEnabled ? '#aaa' : '#999'}
            />
            {searchTerm.length > 0 && (
              <TouchableRipple onPress={clearSearch} style={{ marginLeft: 'auto' }}>
                <MaterialIcons
                  name="close"
                  size={26}
                  color={isDarkThemeEnabled ? '#ddd' : 'gray'}
                  style={{ marginRight: 3 }}
                />
              </TouchableRipple>
            )}
            {selectedValue === '1' && (
              <TouchableRipple onPress={showDatePicker} rippleColor="rgba(0, 0, 0, .32)">
                <AntDesign name="calendar" size={20} color={isDarkThemeEnabled ? '#ddd' : 'gray'} style={{ marginLeft: 10 }} />
              </TouchableRipple>
            )}
          </View>
        </View>
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
              renderItem={({ item }) => (
                <DocumentList
                  documents={[item]}
                  isTextSearch={isTextSearch}
                  onDelete={handleSearch}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            />
          </>
        )}
        <DatePickerModal
          mode="range"
          locale="ko"
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onConfirm={onDateConfirm}
        />
        <UploadModal visible={visibleModal === 'upload'} hideModal={hideModal} onUploadSuccess={handleSearch} />
        <FAB
          icon="upload"
          onPress={() => showModal('upload')}
          style={{
            backgroundColor: isDarkThemeEnabled ? '#333' : '#fff',
            borderWidth: 1,
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
          color={isDarkThemeEnabled ? '#fff' : '#333'}
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
  dropdownandsearchContainer: {
    flexDirection: 'row'
  },
  dropdownContainer: {
    flex: 3,
    marginRight: 10,
  },
  dropdown: {
    height: 59,
    borderRadius: 4,
    borderWidth: 1,
    elevation: 5,
  },
  searchBarContainer: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 4,
  },
  HomeTextInput: {
    flex: 1,
    height: 57,
    paddingLeft: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1, // 전체 화면을 차지하도록 수정
    justifyContent: 'center', // 수직 가운데 정렬
    alignItems: 'center', // 수평 가운데 정렬
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center', // 텍스트를 가운데 정렬
  },
});
export default HomeScreen;
