// DocumentList.js
import React from 'react';
import { View, FlatList, Image, Text } from 'react-native';
import { Card, Surface } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';

const styles = {
  card: {
    marginVertical: 5,
    padding: 20,
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
    flex: 1,
    marginRight: 15,
  },
  CardthumbnailImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
  },
  defaultImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultImageText: {
    color: '#999',
    fontSize: 14,
  },
  CardContentContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  CardTitleText: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  CardTypeContainer: {
    backgroundColor: '#DF0101',
    width: 60, 
    height: 35, 
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  CardTypeText: {
    color: '#fff', 
    fontSize: 15,
    fontWeight: 'bold',
  },
  CardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },  
  CardDateText: {
    marginTop: 10,
    fontSize: 12,
    color: '#aaa',
  },
  CardStorageText: {
    fontSize: 15,
    color: '#aaa',
  },
  CardPageText: {
    fontSize: 15,
    color: '#aaa',
  },
};

const DocumentList = ({ documents }) => {
  const renderItem = ({ item }) => {
    return (
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
            <View style={styles.CardContentContainer}>
              <Text style={styles.CardTitleText}>{item.title}</Text>
              <Surface style={styles.CardTypeContainer}>
                <Text style={styles.CardTypeText}>{item.extension}</Text>
              </Surface>
              <Text style={styles.CardDateText}>{item.uploaddate}</Text>
            </View>
          </View>

          <View style={styles.CardInfoRow}>
            <Text style={styles.CardStorageText}>{item.content}</Text>
            <Text style={styles.CardPageText}>{item.pages}P</Text>
            <AntDesign name="star" size={20} color="#aaa" /> 
          </View>
        </Card>
    );
  };

  return (
    <FlatList
      data={documents}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

export default DocumentList;
