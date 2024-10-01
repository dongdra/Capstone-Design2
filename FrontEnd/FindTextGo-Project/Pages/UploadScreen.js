// UploadScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

const UploadScreen = () => (
  <View style={styles.container}>
    <Text>파일 업로드 화면입니다.</Text>
  </View>
);

export default UploadScreen;
