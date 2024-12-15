// logService.js
import * as FileSystem from 'expo-file-system';

const LOG_PREFIX = 'activity_logs_';

// 사용자별 로그 파일 경로 생성
const getLogFilePath = (identifier) =>
  `${FileSystem.documentDirectory}${LOG_PREFIX}${identifier}.json`;

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

    const logFilePath = getLogFilePath(identifier);

    // 기존 로그 가져오기
    let logs = [];
    if (await FileSystem.getInfoAsync(logFilePath).then((info) => info.exists)) {
      const existingLogs = await FileSystem.readAsStringAsync(logFilePath);
      logs = JSON.parse(existingLogs);
    }

    // 새로운 로그 추가 후 저장
    logs.push(newLog);
    await FileSystem.writeAsStringAsync(logFilePath, JSON.stringify(logs));
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
    const logFilePath = getLogFilePath(identifier);

    if (await FileSystem.getInfoAsync(logFilePath).then((info) => info.exists)) {
      const logs = await FileSystem.readAsStringAsync(logFilePath);
      return JSON.parse(logs);
    } else {
      return [];
    }
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
    const logFilePath = getLogFilePath(identifier);

    if (await FileSystem.getInfoAsync(logFilePath).then((info) => info.exists)) {
      await FileSystem.deleteAsync(logFilePath);
    }
  } catch (error) {
    console.error("Error clearing logs:", error);
  }
};
