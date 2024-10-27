import React, { useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Chip, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DatePickerModal } from 'react-native-paper-dates';
import { en, registerTranslation } from 'react-native-paper-dates';

registerTranslation('en', en);

const FilterDialog = ({ visible, onDismiss, onApply }) => {
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [range, setRange] = useState({ startDate: null, endDate: null });
  const [singleDate, setSingleDate] = useState(null);
  const [showRangeCalendar, setShowRangeCalendar] = useState(false);
  const [showSingleCalendar, setShowSingleCalendar] = useState(false);

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const resetFilters = () => {
    setSelectedFilters([]);
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
      fileType: selectedFilters, // 파일 속성 필터
    });
    onDismiss(); // 다이얼로그 닫기
  };

  const renderChip = ({ item }) => (
    <Chip
      style={styles.chip}
      mode="outlined"
      selected={selectedFilters.includes(item)}
      onPress={() => toggleFilter(item)}
    >
      {item}
    </Chip>
  );

  const filterOptions = {
    fileAttributes: ['filetype:', 'size:', 'filename:'],
    pageCount: ['pages'],
  };

  const formatDate = (date) => (date ? date.toLocaleDateString() : '날짜 선택');

  return (
    <Portal>
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
    <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
  <Icon name="close" size={30} color="#000" />
</TouchableOpacity>

      <Text style={styles.dialogTitle}>검색 태그</Text>

        <ScrollView>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>업로드 날짜 선택</Text>
            <Button
              mode="outlined"
              onPress={() => setShowRangeCalendar(true)}
              style={styles.calendarButton}
            >
              {range.startDate && range.endDate
                ? `${formatDate(range.startDate)} ~ ${formatDate(range.endDate)}`
                : '기간 선택'}
            </Button>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>당일 날짜 선택</Text>
            <Button
              mode="outlined"
              onPress={() => setShowSingleCalendar(true)}
              style={styles.calendarButton}
            >
              {singleDate ? formatDate(singleDate) : '당일 날짜 선택'}
            </Button>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>파일 속성</Text>
            <FlatList
              data={filterOptions.fileAttributes}
              keyExtractor={(item) => item}
              renderItem={renderChip}
              numColumns={3}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>페이지 수</Text>
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
            style={[styles.button, styles.resetButton]}
          >
            선택 초기화
          </Button>
          <Button mode="contained" onPress={applyFilters} style={[styles.button, styles.applyButton]}>
            적용
          </Button>
        </View>

        {/* 항상 렌더링된 모달 */}
        <DatePickerModal
          mode="range"
          visible={showRangeCalendar}
          onDismiss={() => setShowRangeCalendar(false)}
          startDate={range.startDate}
          endDate={range.endDate}
          onConfirm={onRangeConfirm}
          locale="en"
        />

        <DatePickerModal
          mode="single"
          visible={showSingleCalendar}
          onDismiss={() => setShowSingleCalendar(false)}
          date={singleDate}
          onConfirm={onSingleDateConfirm}
          locale="en"
        />
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 15
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
  calendarButton: {
    marginVertical: 5,
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
});

export default FilterDialog;
