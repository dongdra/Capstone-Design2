import React, { useState, useContext } from 'react';
import { View, FlatList, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Chip, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DatePickerModal } from 'react-native-paper-dates';
import { en, registerTranslation } from 'react-native-paper-dates';
import { DataContext } from '../../../../DataContext'; // 다크 모드 상태를 가져오기 위한 import

registerTranslation('en', en);

const FilterDialog = ({ visible, onDismiss, onApply }) => {
  const { isDarkThemeEnabled } = useContext(DataContext); // 다크 모드 상태 가져오기
  const [selectedFilter, setSelectedFilter] = useState(null); // 하나의 필터만 선택 가능
  const [range, setRange] = useState({ startDate: null, endDate: null });
  const [singleDate, setSingleDate] = useState(null);
  const [showRangeCalendar, setShowRangeCalendar] = useState(false);
  const [showSingleCalendar, setShowSingleCalendar] = useState(false);

  const toggleFilter = (filter) => {
    setSelectedFilter((prev) => (prev === filter ? null : filter));
  };

  const resetFilters = () => {
    setSelectedFilter(null);
    setRange({ startDate: null, endDate: null });
    setSingleDate(null);
  };

  const handleDismiss = () => {
    resetFilters();
    onDismiss();
  };

  const onRangeConfirm = ({ startDate, endDate }) => {
    setRange({ startDate, endDate });
    setShowRangeCalendar(false);
  };

  const onSingleDateConfirm = (params) => {
    setSingleDate(params.date);
    setShowSingleCalendar(false);
  };

  const applyFilters = () => {
    onApply({
      uploadDate: range, // 범위 날짜 필터
      singleDate, // 당일 날짜 필터
      fileType: selectedFilter, // 선택된 파일 속성 필터 (단일 값)
    });
    onDismiss(); // 다이얼로그 닫기
  };

  const renderChip = ({ item }) => (
    <Chip
      style={[styles.chip, isDarkThemeEnabled && styles.darkChip]}
      mode="outlined"
      selected={selectedFilter === item}
      onPress={() => toggleFilter(item)}
    >
      {item}
    </Chip>
  );

  const filterOptions = {
    fileAttributes: ['filetype:', 'size:', 'filename:'],
    pageCount: ['pages', 'text:'],
  };

  const formatDate = (date) => (date ? date.toLocaleDateString() : '날짜 선택');

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        style={[
          styles.dialog,
          { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' },
        ]}
      >
        <Text
          style={[
            styles.dialogTitle,
            { color: isDarkThemeEnabled ? '#fff' : '#000' },
          ]}
        >
          검색 태그
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Icon name="close" size={30} color={isDarkThemeEnabled ? '#fff' : '#000'} />
        </TouchableOpacity>
        <ScrollView>
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkThemeEnabled ? '#fff' : '#000' },
              ]}
            >
              업로드 날짜 선택
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowRangeCalendar(true)}
              style={[
                styles.calendarButton,
                isDarkThemeEnabled && styles.darkButton,
              ]}
            >
              {range.startDate && range.endDate
                ? `${formatDate(range.startDate)} ~ ${formatDate(range.endDate)}`
                : '기간 선택'}
            </Button>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkThemeEnabled ? '#fff' : '#000' },
              ]}
            >
              당일 날짜 선택
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowSingleCalendar(true)}
              style={[
                styles.calendarButton,
                isDarkThemeEnabled && styles.darkButton,
              ]}
            >
              {singleDate ? formatDate(singleDate) : '당일 날짜 선택'}
            </Button>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkThemeEnabled ? '#fff' : '#000' },
              ]}
            >
              파일 속성
            </Text>
            <FlatList
              data={filterOptions.fileAttributes}
              keyExtractor={(item) => item}
              renderItem={renderChip}
              numColumns={3}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkThemeEnabled ? '#fff' : '#000' },
              ]}
            >
              페이지 수, 키워드 검색
            </Text>
            <FlatList
              data={filterOptions.pageCount}
              keyExtractor={(item) => item}
              renderItem={renderChip}
              numColumns={3}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={resetFilters}
            style={[
              styles.button,
              styles.resetButton,
              isDarkThemeEnabled && styles.darkResetButton,
            ]}
          >
            선택 초기화
          </Button>
          <Button
            mode="contained"
            onPress={applyFilters}
            style={[
              styles.button,
              styles.applyButton,
              isDarkThemeEnabled && styles.darkApplyButton,
            ]}
          >
            적용
          </Button>
        </View>

        <DatePickerModal
          mode="range"
          visible={showRangeCalendar}
          onDismiss={() => setShowRangeCalendar(false)}
          startDate={range.startDate}
          endDate={range.endDate}
          onConfirm={onRangeConfirm}
          locale="en"
          theme={{
            colors: {
              primary: isDarkThemeEnabled ? '#aaa' : '#536ed9',
              background: isDarkThemeEnabled ? '#333' : '#fff',
            },
          }}
        />
        <DatePickerModal
          mode="single"
          visible={showSingleCalendar}
          onDismiss={() => setShowSingleCalendar(false)}
          date={singleDate}
          onConfirm={onSingleDateConfirm}
          locale="en"
          theme={{
            colors: {
              primary: isDarkThemeEnabled ? '#aaa' : '#536ed9',
              background: isDarkThemeEnabled ? '#333' : '#fff',
            },
          }}
        />
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    padding: 20,
    borderRadius: 12,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  chip: {
    margin: 5,
    borderRadius: 20,
  },
  darkChip: {
    backgroundColor: '#555',
    borderColor: '#aaa',
  },
  calendarButton: {
    marginVertical: 5,
  },
  darkButton: {
    borderColor: '#aaa',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  resetButton: {
    backgroundColor: '#d95e53',
  },
  applyButton: {
    backgroundColor: '#536ed9',
  },
  darkResetButton: {
    backgroundColor: '#a33',
  },
  darkApplyButton: {
    backgroundColor: '#445',
  },
});

export default FilterDialog;
