// SummaryModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 더 어두운 배경
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  summaryContainer: {
    marginTop: 10,
    maxHeight: 300, // 최대 높이 설정
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24, // 가독성을 높이기 위한 줄 간격
  },
});

const SummaryModal = ({ visible, onClose, summary }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>문서 요약</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              {summary || '요약을 불러오는 중...'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};



export default SummaryModal;
