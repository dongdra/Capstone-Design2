import AsyncStorage from '@react-native-async-storage/async-storage';

// 사용자별 즐겨찾기 키 생성
const getFavoritesKey = (identifier) => `favorite_documents_${identifier}`;

// 즐겨찾기 추가
export const addFavorite = async (identifier, documentId, documentTitle, documentPage) => {
  if (!identifier) {
    console.error("Identifier is required to add a favorite.");
    return;
  }
  try {
    const favorites = await getFavorites(identifier);
    const isFavoriteExists = favorites.some((doc) => doc.id === documentId);
    if (!isFavoriteExists) {
      favorites.push({ id: documentId, title: documentTitle, pages: documentPage });
      await AsyncStorage.setItem(getFavoritesKey(identifier), JSON.stringify(favorites));
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
  }
};

// 즐겨찾기 제거
export const removeFavorite = async (identifier, documentId) => {
  if (!identifier) {
    console.error("Identifier is required to remove a favorite.");
    return;
  }
  try {
    let favorites = await getFavorites(identifier);
    favorites = favorites.filter((doc) => doc.id !== documentId);
    await AsyncStorage.setItem(getFavoritesKey(identifier), JSON.stringify(favorites));
  } catch (error) {
    console.error("Error removing favorite:", error);
  }
};

// 모든 즐겨찾기 가져오기
export const getFavorites = async (identifier) => {
  if (!identifier) {
    console.error("Identifier is required to fetch favorites.");
    return [];
  }
  try {
    const favorites = await AsyncStorage.getItem(getFavoritesKey(identifier));
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};
