import React, { useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { DataContext } from '../../../../../DataContext';

const SummaryModal = ({ visible, onClose, summary, isLoading }) => {
  const { isDarkThemeEnabled } = useContext(DataContext);

  // 클립보드에 복사
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(summary);
    Alert.alert('복사 완료', '요약 내용이 클립보드에 복사되었습니다.');
  };

  // 공유 기능
  const shareSummary = async () => {
    try {
      await Share.share({
        message: summary,
      });
    } catch (error) {
      Alert.alert('공유 실패', '내용 공유 중 오류가 발생했습니다.');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalBackground}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDarkThemeEnabled ? '#fff' : '#333' },
              ]}
            >
              문서 요약
            </Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={copyToClipboard} style={styles.icon}>
                <Feather
                  name="copy"
                  size={24}
                  color={isDarkThemeEnabled ? '#bbb' : '#555'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareSummary} style={styles.icon}>
                <Feather
                  name="share-2"
                  size={24}
                  color={isDarkThemeEnabled ? '#bbb' : '#555'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.icon}>
                <Feather
                  name="x"
                  size={24}
                  color={isDarkThemeEnabled ? '#bbb' : '#555'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={isDarkThemeEnabled ? '#bbb' : '#555'}
              />
              <Text
                style={{
                  color: isDarkThemeEnabled ? '#bbb' : '#555',
                }}
              >
                요약을 불러오는 중...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.summaryContainer}>
              <Text
                style={[
                  styles.summaryText,
                  { color: isDarkThemeEnabled ? '#ddd' : '#555' },
                ]}
              >
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
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 10,
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
