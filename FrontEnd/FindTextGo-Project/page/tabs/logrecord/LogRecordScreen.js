// LogRecordScreen.js
import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { addLog, getLogs, clearLogs } from '../../../logService';
import { DataContext } from '../../../DataContext';

const LogRecordScreen = () => {
  const { isDarkThemeEnabled, identifier } = useContext(DataContext); // 다크 모드 상태 및 사용자 identifier 가져오기
  const [logs, setLogs] = useState([]);

  const loadLogs = useCallback(async () => {
    if (!identifier) {
      console.error("Identifier is required to load logs.");
      return;
    }
    const savedLogs = await getLogs(identifier);
    setLogs(savedLogs);
  }, [identifier]);

  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        if (!identifier) {
          console.error("Identifier is required to add a log.");
          return;
        }
        await addLog(identifier, '활동 로그 페이지에 접속했습니다.');
        await loadLogs();
      };
      logVisit();
    }, [loadLogs, identifier])
  );

  return (
    <PaperProvider>
      <View style={[
        styles.container,
        { backgroundColor: isDarkThemeEnabled ? '#333' : '#f5f5f5' }
      ]}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[
              styles.logemptyText,
              { color: isDarkThemeEnabled ? '#bbb' : '#666' }
            ]}>
              페이지에 접속한 기록이 없습니다.
            </Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            renderItem={({ item }) => <LogCard log={item} isDarkThemeEnabled={isDarkThemeEnabled} />}
            keyExtractor={(item, index) => index.toString()}
          />
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={loadLogs}
            style={[
              styles.logrefreshbutton,
              { backgroundColor: isDarkThemeEnabled ? '#4a67c7' : '#536ed9' }
            ]}
          >
            <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>새로고침</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            onPress={async () => {
              if (!identifier) {
                console.error("Identifier is required to clear logs.");
                return;
              }
              await clearLogs(identifier);
              loadLogs();
            }}
            style={[
              styles.logdeletebutton,
              { backgroundColor: isDarkThemeEnabled ? '#c75050' : '#d95e53' }
            ]}
          >
            <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>기록 삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
};

// 개별 로그를 카드 형태로 표시하는 컴포넌트
const LogCard = ({ log, isDarkThemeEnabled }) => (
  <View style={[
    styles.card,
    { backgroundColor: isDarkThemeEnabled ? '#444' : '#fff' }
  ]}>
    <Text style={[
      styles.cardTitle,
      { color: isDarkThemeEnabled ? '#fff' : '#000' }
    ]}>
      {log.message}
    </Text>
    <Text style={[
      styles.cardTimestamp,
      { color: isDarkThemeEnabled ? '#aaa' : '#666' }
    ]}>
      {log.timestamp}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTimestamp: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  logrefreshbutton: {
    width: "35%",
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  logdeletebutton: {
    width: "35%",
    paddingVertical: 15,
    borderRadius: 10,
  },
  logemptyText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default LogRecordScreen;
