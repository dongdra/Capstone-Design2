import * as SQLite from 'expo-sqlite';

// 데이터베이스 연결을 한 곳에서 관리
const openDatabase = (dbName) => {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }
  return SQLite.openDatabase(dbName);
};