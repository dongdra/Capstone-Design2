// SettingsScreen.js
import React, { useEffect, useContext } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Divider, Switch, List } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native'; // useNavigation 훅 사용
import { DataContext } from '../DataContext';

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
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
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
  const navigation = useNavigation(); // 네비게이션 객체 가져오기
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = React.useState(false);
  const { 
    isDarkThemeEnabled, 
    setIsDarkThemeEnabled, 
    isNotificationsEnabled, 
    setIsNotificationsEnabled 
  } = useContext(DataContext);

  const toggleNotifications = () => setIsNotificationsEnabled(!isNotificationsEnabled);
  const toggleDarkTheme = () => setIsDarkThemeEnabled(!isDarkThemeEnabled);

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

  const handleLogout = () => {
    Alert.alert('로그아웃', '성공적으로 로그아웃되었습니다.', [
      { text: '확인', onPress: async () => {
          await onLogout(); // 로그아웃 로직 실행
          navigation.replace('LoginPage'); // 스택을 교체하며 LoginPage로 이동
        }
      },
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
          right={() => <Switch value={isNotificationsEnabled} onValueChange={toggleNotifications} />}
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
          right={() => <Switch value={isDarkThemeEnabled} onValueChange={toggleDarkTheme} />}
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
