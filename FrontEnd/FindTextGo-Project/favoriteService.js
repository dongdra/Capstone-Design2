// favoriteService.js
import * as FileSystem from 'expo-file-system';

// 사용자별 즐겨찾기 파일 경로 생성
const getFavoritesFilePath = (identifier) =>
  `${FileSystem.documentDirectory}favorite_documents_${identifier}.json`;

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
      const filePath = getFavoritesFilePath(identifier);
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(favorites));
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
    const filePath = getFavoritesFilePath(identifier);
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(favorites));
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
    const filePath = getFavoritesFilePath(identifier);
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (fileInfo.exists) {
      const favorites = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(favorites);
    }

    return [];
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};
