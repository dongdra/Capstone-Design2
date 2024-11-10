// FavoritesScreen.js
import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getFavorites } from '../../../favoriteService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DataContext } from '../../../DataContext';
import { addLog, getLogs } from '../../../logService';

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const { isDarkThemeEnabled } = useContext(DataContext); // 다크 모드 상태 가져오기
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchFavorites = useCallback(async () => {
    try {
      const favorites = await getFavorites();
      setFavoriteDocuments(favorites);
    } catch (error) {
      console.error('즐겨찾기 목록을 불러오는 중 오류 발생:', error);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const savedLogs = await getLogs();
      setLogs(savedLogs);
    } catch (error) {
      console.error('로그 로드 중 오류 발생:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        try {
          await addLog('즐겨찾기 페이지에 접속했습니다.');
          await Promise.all([loadLogs(), fetchFavorites()]); // 로그와 즐겨찾기 목록을 병렬로 로드
        } catch (error) {
          console.error('페이지 로드 중 오류 발생:', error);
        }
      };
      logVisit();
    }, [loadLogs, fetchFavorites])
  );

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        { backgroundColor: isDarkThemeEnabled ? '#444' : '#f8f8f8', borderBottomColor: isDarkThemeEnabled ? '#555' : '#ccc' }
      ]}
      onPress={() => {
        console.log('Navigating to DocumentViewer with documentId:', item.id, 'and documentPage:', item.pages);
        navigation.navigate('DocumentViewer', {
          documentId: item.id, 
          documentPage: item.pages, 
          fileName: item.title
        });
      }}
    >
      <Text style={[styles.itemText, { color: isDarkThemeEnabled ? '#fff' : '#000' }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screenContainer, { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' }]}>
      {favoriteDocuments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDarkThemeEnabled ? '#bbb' : '#666' }]}>즐겨찾기한 문서가 없습니다.</Text>
        </View>
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
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default FavoritesScreen;
