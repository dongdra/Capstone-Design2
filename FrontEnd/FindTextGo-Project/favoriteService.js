// favoriteservice.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorite_documents';

// 즐겨찾기 추가
export const addFavorite = async (documentId, documentTitle) => {
  try {
    const favorites = await getFavorites();
    const isFavoriteExists = favorites.some((doc) => doc.id === documentId);
    if (!isFavoriteExists) {
      favorites.push({ id: documentId, title: documentTitle }); // ID와 제목만 저장
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
  }
};

// 즐겨찾기 제거
export const removeFavorite = async (documentId) => {
  try {
    let favorites = await getFavorites();
    favorites = favorites.filter((doc) => doc.id !== documentId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error removing favorite:", error);
  }
};

// 모든 즐겨찾기 가져오기
export const getFavorites = async () => {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};
