// logService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_PREFIX = 'activity_logs_';

// 사용자별 로그 키 생성
const getLogKey = (identifier) => `${LOG_PREFIX}${identifier}`;

// 로그 추가
export const addLog = async (identifier, message) => {
  if (!identifier) {
    console.error("Identifier is required to add a log.");
    return;
  }

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

    const logKey = getLogKey(identifier);

    // 기존 로그 가져오기
    const logs = await AsyncStorage.getItem(logKey);
    const parsedLogs = logs ? JSON.parse(logs) : [];

    // 새로운 로그 추가 후 저장
    parsedLogs.push(newLog);
    await AsyncStorage.setItem(logKey, JSON.stringify(parsedLogs));
  } catch (error) {
    console.error("Error adding log:", error);
  }
};

// 모든 로그 가져오기 (사용자별)
export const getLogs = async (identifier) => {
  if (!identifier) {
    console.error("Identifier is required to fetch logs.");
    return [];
  }

  try {
    const logKey = getLogKey(identifier);
    const logs = await AsyncStorage.getItem(logKey);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

// 로그 초기화 (사용자별)
export const clearLogs = async (identifier) => {
  if (!identifier) {
    console.error("Identifier is required to clear logs.");
    return;
  }

  try {
    const logKey = getLogKey(identifier);
    await AsyncStorage.removeItem(logKey);
  } catch (error) {
    console.error("Error clearing logs:", error);
  }
};
