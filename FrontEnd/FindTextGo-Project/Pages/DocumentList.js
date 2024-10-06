///DocumentList.js
import React from 'react';
import { View, FlatList, Image, Text, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';

const styles = {
  card: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    marginRight: 15,
  },
  cardImage: {
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
  contentContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
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
    color: '#aaa',
  },
};

const DocumentList = ({ documents }) => {
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
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.cardTitle}>{item.title}</Text>     
            <Text style={styles.cardTitle}>파일 형식: {item.extenstion}</Text>  
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.cardId}>ID: {item.id}</Text>
          <Text style={styles.cardDescription}>파일크기: {item.content}</Text>
          <Text style={styles.cardDate}>{item.uploaddate}</Text>
          <Text style={styles.cardPageInfo}>Pages: {item.pages}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={documents}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

export default DocumentList;
