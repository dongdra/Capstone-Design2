// FavoritesScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getFavorites } from '../../../../favoriteService';
import { useFocusEffect } from '@react-navigation/native';

const FavoritesScreen = () => {
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);

  const fetchFavorites = async () => {
    const favorites = await getFavorites();
    setFavoriteDocuments(favorites);
  };

  // 화면이 포커스될 때마다 즐겨찾기 목록 새로고침
  useFocusEffect(
    React.useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const renderFavoriteItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>즐겨찾기 목록</Text>
      {favoriteDocuments.length === 0 ? (
        <Text style={styles.emptyText}>즐겨찾기한 문서가 없습니다.</Text>
      ) : (
        <FlatList
          data={favoriteDocuments}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

export default FavoritesScreen;
