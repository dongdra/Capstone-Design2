// logService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = 'activity_logs';

// 로그 추가
export const addLog = async (message) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timestamp = `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
    const newLog = { message, timestamp };

    // 기존 로그 가져오기
    const logs = await AsyncStorage.getItem(LOG_KEY);
    const parsedLogs = logs ? JSON.parse(logs) : [];

    // 새로운 로그 추가 후 저장
    parsedLogs.push(newLog);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(parsedLogs));
  } catch (error) {
    console.error("Error adding log:", error);
  }
};

// 모든 로그 가져오기
export const getLogs = async () => {
  try {
    const logs = await AsyncStorage.getItem(LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

// 로그 초기화 (필요할 때 사용)
export const clearLogs = async () => {
  try {
    await AsyncStorage.removeItem(LOG_KEY);
  } catch (error) {
    console.error("Error clearing logs:", error);
  }
};
