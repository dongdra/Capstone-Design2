<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
// DocumentList.js
import React from 'react';
import { View, FlatList, Image, Text } from 'react-native';
import { Card, Surface } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
=======
=======
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
///DocumentList.js
import React from 'react';
import { View, FlatList, Image, Text, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)

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
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  CardTitleText: {
    fontSize: 19,
=======
  cardTitle: {
    fontSize: 15,
>>>>>>> parent of 964327c (태그추가)
=======
  cardTitle: {
    fontSize: 15,
>>>>>>> parent of 964327c (태그추가)
=======
  cardTitle: {
    fontSize: 15,
>>>>>>> parent of 964327c (태그추가)
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
  infoRow: {
>>>>>>> parent of 964327c (태그추가)
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  },  
  CardDateText: {
    marginTop: 10,
    fontSize: 12,
    color: '#aaa',
  },
  CardStorageText: {
    fontSize: 15,
=======
  },
  cardId: {
    fontSize: 12,
    color: '#aaa',
  },
  cardDescription: {
    fontSize: 12,
    color: '#aaa',
  },
  cardDate:{
    fontSize: 12,
    color: '#aaa',
  },
  cardPageInfo: {
    fontSize: 12,
>>>>>>> parent of 964327c (태그추가)
    color: '#aaa',
  },
  CardPageText: {
    fontSize: 15,
=======
  },
  cardId: {
    fontSize: 12,
    color: '#aaa',
  },
  cardDescription: {
    fontSize: 12,
    color: '#aaa',
  },
  cardDate:{
    fontSize: 12,
    color: '#aaa',
  },
  cardPageInfo: {
    fontSize: 12,
>>>>>>> parent of 964327c (태그추가)
=======
  },
  cardId: {
    fontSize: 12,
    color: '#aaa',
  },
  cardDescription: {
    fontSize: 12,
    color: '#aaa',
  },
  cardDate:{
    fontSize: 12,
    color: '#aaa',
  },
  cardPageInfo: {
    fontSize: 12,
>>>>>>> parent of 964327c (태그추가)
    color: '#aaa',
  },
};

const DocumentList = ({ documents }) => {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
  const renderItem = ({ item }) => (
    <TouchableOpacity>
      <Card style={styles.card}>
        <View style={styles.contentRow}>
          <View style={styles.imageContainer}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.cardImage} />
            ) : (
              <View style={styles.defaultImage}>
                <Text style={styles.defaultImageText}>No Image</Text>
              </View>
            )}
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.cardTitle}>{item.title}</Text>     
            <Text style={styles.cardTitle}>파일 형식: {item.extenstion}</Text>  
          </View>
        </View>

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
          <View style={styles.CardInfoRow}>
            <Text style={styles.CardStorageText}>{item.content}</Text>
            <Text style={styles.CardPageText}>{item.pages}P</Text>
            <AntDesign name="star" size={20} color="#aaa" /> 
          </View>
        </Card>
    );
  };
=======
=======
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
        <View style={styles.infoRow}>
          <Text style={styles.cardId}>ID: {item.id}</Text>
          <Text style={styles.cardDescription}>파일크기: {item.content}</Text>
          <Text style={styles.cardDate}>{item.uploaddate}</Text>
          <Text style={styles.cardPageInfo}>Pages: {item.pages}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)
=======
>>>>>>> parent of 964327c (태그추가)

  return (
    <FlatList
      data={documents}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

export default DocumentList;
