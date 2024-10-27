// ActivityLogScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ActivityLogScreen = () => (
  <View style={styles.screenContainer}>
    <Text>활동 로그 페이지 입니다.</Text>
  </View>
);

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default ActivityLogScreen;
