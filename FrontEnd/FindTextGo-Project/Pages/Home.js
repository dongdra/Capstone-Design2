// Home.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';

const HomeRoute = () => (
  <View style={styles.container}>
    <Text>홈 화면입니다. 로그인 성공!</Text>
  </View>
);

const SettingsRoute = () => (
  <View style={styles.container}>
    <Text>설정 화면입니다.</Text>
  </View>
);

const ProfileRoute = () => (
  <View style={styles.container}>
    <Text>프로필 화면입니다.</Text>
  </View>
);

export default function Home() {
  const [index, setIndex] = useState(0); // 현재 선택된 탭 인덱스 관리
  const [routes] = useState([
    { key: 'home', title: '홈', icon: 'home' },
    { key: 'settings', title: '설정', icon: 'cog' },
    { key: 'profile', title: '프로필', icon: 'account' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeRoute,
    settings: SettingsRoute,
    profile: ProfileRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
