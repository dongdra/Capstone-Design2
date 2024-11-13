import React, { useContext } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DataContext } from '../../../../../DataContext';

const SummaryModal = ({ visible, onClose, summary, isLoading }) => {
  const { isDarkThemeEnabled } = useContext(DataContext); // 다크 모드 상태 가져오기

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalBackground}>
        <View style={[
          styles.modalContainer,
          { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' }
        ]}>
          <View style={styles.header}>
            <Text style={[
              styles.title,
              { color: isDarkThemeEnabled ? '#fff' : '#333' }
            ]}>문서 요약</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={isDarkThemeEnabled ? '#bbb' : '#555'} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDarkThemeEnabled ? '#bbb' : '#555'} />
              <Text style={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}>요약을 불러오는 중...</Text>
            </View>
          ) : (
            <ScrollView style={styles.summaryContainer}>
              <Text style={[
                styles.summaryText,
                { color: isDarkThemeEnabled ? '#ddd' : '#555' }
              ]}>
                {summary}
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    padding: 20,
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
  },
  summaryContainer: {
    marginTop: 10,
    maxHeight: 300,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
});

export default SummaryModal;
