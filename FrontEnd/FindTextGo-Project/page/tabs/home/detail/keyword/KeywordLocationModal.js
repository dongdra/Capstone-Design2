import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // 아이콘 사용

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%', // 모달 최대 높이 제한
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeIcon: {
    color: '#333',
    fontSize: 24,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  keywordList: {
    flexGrow: 0, // FlatList와 ScrollView의 충돌 방지
  },
  keywordItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  keywordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
});

const KeywordModal = ({ visible, onClose, ocrResults }) => {
  // 중복 제거 로직
  const uniqueResults = ocrResults.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.extracted_text === item.extracted_text)
  );

  const renderKeywordItem = ({ item }) => (
    <View style={styles.keywordItem}>
      <Text style={styles.keywordText}>{item.extracted_text}</Text>
      <Text style={styles.coordinatesText}>Page: {item.page_number}</Text>
    </View>
  );

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" style={styles.closeIcon} />
          </TouchableOpacity>
          <FlatList
            data={uniqueResults} // 중복 제거된 데이터 전달
            renderItem={renderKeywordItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.keywordList}
          />
        </View>
      </View>
    </Modal>
  );
};

export default KeywordModal;
