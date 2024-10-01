// ProfileScreen.js
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

const ProfileScreen = () => (
  <View style={styles.container}>
    <Text>프로필 화면입니다.</Text>
  </View>
);

export default ProfileScreen;
