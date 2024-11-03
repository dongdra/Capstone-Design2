// ActivityLogScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Button, Provider as PaperProvider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { addLog, getLogs, clearLogs } from '../../../../logService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
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
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  logrefreshbutton:{
    width: "35%", 
    height:"auto",
    backgroundColor: '#536ed9',
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  logdeletebutton:{
    width: "35%", 
    height:"auto",
    backgroundColor: '#d95e53',
    paddingVertical: 10,
    borderRadius: 10,
  }
});

// 개별 로그를 카드 형태로 표시하는 컴포넌트
const LogCard = ({ log }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{log.message}</Text>
    <Text style={styles.cardTimestamp}>{log.timestamp}</Text>
  </View>
);

const ActivityLogScreen = () => {
  const [logs, setLogs] = useState([]);

  const loadLogs = useCallback(async () => {
    const savedLogs = await getLogs();
    setLogs(savedLogs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        await addLog('활동 로그 페이지에 접속했습니다.');
        await loadLogs();
      };
      logVisit();
    }, [loadLogs])
  );

  return (
    <PaperProvider>
      <View style={styles.container}>
        <FlatList
          data={logs}
          renderItem={({ item }) => <LogCard log={item} />}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text>저장된 로그가 없습니다.</Text>}
        />
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={loadLogs} 
            labelStyle={{ fontSize: 15 }} 
            style={styles.logrefreshbutton}
          >
            새로고침
          </Button>
          <Button 
            mode="contained" 
            onPress={async () => {
              await clearLogs();
              loadLogs();
            }}
            labelStyle={{ fontSize: 15 }} 
            style={styles.logdeletebutton}
          >
            로그 초기화
          </Button>
        </View>
      </View>
    </PaperProvider>
  );
};

export default ActivityLogScreen;
