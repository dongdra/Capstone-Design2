// ProfileScreen.js
import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Title, Divider, Switch, List } from 'react-native-paper';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    alignSelf: 'center',
  },
  listItem: {
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
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
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});

const SettingsScreen = ({ onLogout }) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(false);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = React.useState(false);
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = React.useState(false);

  const toggleNotifications = () => setIsNotificationsEnabled(!isNotificationsEnabled);
  const toggleAutoLogin = async () => {
    setIsAutoLoginEnabled(!isAutoLoginEnabled);
    if (!isAutoLoginEnabled) {
      await SecureStore.deleteItemAsync('identifier');
      await SecureStore.deleteItemAsync('password');
    }
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
        <Title style={styles.title}>설정 화면</Title>
        <Divider style={styles.divider} />

        <List.Item
          title="알림 설정"
          description="앱 알림을 켜거나 끕니다."
          right={() => (
            <Switch value={isNotificationsEnabled} onValueChange={toggleNotifications} />
          )}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="앱 테마 변경"
          description="다크 모드를 켜거나 끕니다."
          right={() => (
            <Switch value={isDarkThemeEnabled} onValueChange={toggleDarkTheme} />
          )}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="로그 기록"
          description="사용자 활동 기록을 확인합니다."
          onPress={() => Alert.alert('로그 기록', '사용자 로그 기록을 확인합니다.')}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="자동 로그인 설정"
          description="자동 로그인을 설정합니다."
          right={() => (
            <Switch value={isAutoLoginEnabled} onValueChange={toggleAutoLogin} />
          )}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />

        <List.Item
          title="앱 버전 정보"
          description="현재 앱 버전을 확인합니다."
          onPress={() => Alert.alert('앱 버전', '현재 앱 버전: 1.0.0')}
          style={styles.listItem}
        />
        <Divider style={styles.divider} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutbutton}
          labelStyle={{ fontSize: 16 }}
        >
          로그아웃
        </Button>
      </View>
    </View>
  );
};

export default SettingsScreen;
