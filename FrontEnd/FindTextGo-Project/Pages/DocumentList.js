// DocumentList.js
import React, { useState, useCallback } from 'react';
import { View, FlatList, Image, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SummaryModal from '../Modal/SummaryModal';
import { API_BASE_URL } from '@env';

const styles = {
  card: {
    marginVertical: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1, // 카드 경계선 추가
    borderColor: '#ddd', // 경계선 색상 설정
    borderRadius: 8, // 경계선 모서리 둥글게 처리
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageContainer: {
    padding: 10,
    flex: 1,
    marginRight: 15,
  },
  CardthumbnailImage: {
    width: '120%',
    height: 200,
    borderWidth: 1, // 선 두께
    borderColor: '#ddd', // 선 색상
  },
  defaultImage: {
    width: '120%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultImageText: {
    color: '#999',
    fontSize: 14,
  },
  CardTitleText: {
    marginLeft: 15,
    marginTop: 18,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  CardIdText:
  {
    marginLeft: 15,
    marginTop: 10,
    fontSize: 14,
    color: '#848484',
  },
  CardDateText: {
    marginLeft: 15,
    marginTop: 10,
    fontSize: 14,
    color: '#848484',
  },
  CardStorageText: {
    marginLeft: 15,
    marginTop: 10,
    fontSize: 14,
    color: '#848484',
  },
  CardTypeText: {
    marginLeft: 3,
    fontSize: 13,
    color: '#848484',
  },
  CardPageText: {
    fontSize: 12,
    color: '#848484',
  },
  divider: {
    backgroundColor: '#ccc'
  },

  CardInfoRow: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
};

const DocumentList = ({ documents }) => {
  const [starColor, setStarColor] = useState('black');
  const [modalVisible, setModalVisible] = useState(false);
  const [summary, setSummary] = useState('');
  const navigation = useNavigation();

  const toggleStarColor = useCallback(() => {
    setStarColor((prevColor) => (prevColor === 'black' ? '#FFBF00' : 'black'));
  }, []);

  const fetchSummary = useCallback(async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/summary/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: 'genji',
          password: 'asdf1234',
          file_id: fileId,  // 동적으로 fileId 전달
        }),
      });
  
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }
  
      const data = await response.json();
      if (data.StatusCode === 200) {
        setSummary(data.data.summary);
      } else {
        Alert.alert('오류', data.message || '요약을 불러오지 못했습니다.');
      }
    } catch (error) {
      console.error('네트워크 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setModalVisible(true);
    }
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('DocumentViewer', {
        fileName: item.title,
        documentId: item.id,
        documentPage: item.pages,
      })}
    >
      <Card style={styles.card}>
        <View style={styles.contentRow}>
          <View style={styles.imageContainer}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.CardthumbnailImage} />
            ) : (
              <View style={styles.defaultImage}>
                <Text style={styles.defaultImageText}>No Image</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'column', flex: 2 }}>
            <Text style={styles.CardTitleText}>{item.title}</Text>
            <Text style={styles.CardDateText}>날짜: {item.uploaddate}</Text>
            <Text style={styles.CardStorageText}>용량: {item.content}</Text>
          </View>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.CardInfoRow}>
  <View style={{ flex: 1, alignItems: 'flex-start' }}>
    <Text style={styles.CardTypeText}>{item.extension}</Text>
  </View>
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={styles.CardPageText}>{item.pages}P</Text>
  </View>
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
    <TouchableOpacity onPress={() => fetchSummary(item.id)} style={{ marginRight: 24 }}>
      <Feather name="file-text" size={24} color="black" />
    </TouchableOpacity>
    <TouchableOpacity onPress={toggleStarColor}>
      <Feather name="star" size={24} color={starColor} />
    </TouchableOpacity>
  </View>
</View>

      </Card>
    </TouchableOpacity>
  );

  return (
    <>
      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      <SummaryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        summary={summary}
      />
    </>
  );
};

export default DocumentList;
