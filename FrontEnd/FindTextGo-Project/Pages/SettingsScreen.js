//SettingsScreen.js
import React, {useEffect} from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Divider, Switch, List } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  listItem: {
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  iconContainer: {
    justifyContent: 'center', // 아이콘을 수직 가운데로 정렬
    alignItems: 'center',
    width: 40, // 아이콘의 영역을 고정된 크기로 설정하여 균일하게 배치
  },
  logoutbutton: {
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#d95e53',
    paddingVertical: 10,
    borderRadius: 10,
  },
  divider: {
    width: '100%',
    marginVertical: 10,
    backgroundColor: '#ccc',
  },
});

const SettingsScreen = ({ onLogout }) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(false);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = React.useState(false);
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = React.useState(false);

  const toggleNotifications = () => setIsNotificationsEnabled(!isNotificationsEnabled);
  
  useEffect(() => {
    const loadAutoLoginSetting = async () => {
      const autoLoginStatus = await SecureStore.getItemAsync('isAutoLoginEnabled');
      setIsAutoLoginEnabled(autoLoginStatus === 'true');
    };
  
    loadAutoLoginSetting();
  }, []);
  
  const toggleAutoLogin = async () => {
    const newValue = !isAutoLoginEnabled;
    setIsAutoLoginEnabled(newValue);
    await SecureStore.setItemAsync('isAutoLoginEnabled', newValue ? 'true' : 'false');
  };

  const toggleDarkTheme = () => setIsDarkThemeEnabled(!isDarkThemeEnabled);

  const handleLogout = () => {
    Alert.alert('로그아웃', '성공적으로 로그아웃되었습니다.', [
      { text: '확인', onPress: () => onLogout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Divider style={styles.divider} />
        <List.Item
          title="알림 설정"
          description="앱 알림을 켜거나 끕니다."
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="bells" size={24} color="#333" />
            </View>
          )}
          right={() => (
            <Switch value={isNotificationsEnabled} onValueChange={toggleNotifications} />
          )}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="앱 테마 변경"
          description="다크 모드를 켜거나 끕니다."
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="bulb1" size={24} color="#333" />
            </View>
          )}
          right={() => (
            <Switch value={isDarkThemeEnabled} onValueChange={toggleDarkTheme} />
          )}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="로그 기록"
          description="사용자 활동 기록을 확인합니다."
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="profile" size={24} color="#333" />
            </View>
          )}
          onPress={() => Alert.alert('로그 기록', '사용자 로그 기록을 확인합니다.')}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="자동 로그인 설정"
          description="자동 로그인을 설정합니다."
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="login" size={24} color="#333" />
            </View>
          )}
          right={() => (
            <Switch value={isAutoLoginEnabled} onValueChange={toggleAutoLogin} />
          )}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="앱 버전 정보"
          description="현재 앱 버전을 확인합니다."
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="infocirlceo" size={24} color="#333" />
            </View>
          )}
          onPress={() => Alert.alert('앱 버전', '현재 앱 버전: 1.0.0')}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutbutton}
          labelStyle={{ fontSize: 16, color: '#fff' }}
        >
          로그아웃
        </Button>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;