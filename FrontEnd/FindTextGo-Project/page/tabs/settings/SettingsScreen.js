// SettingsScreen.js
import React, { useEffect, useContext, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Divider, Switch, List } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { DataContext } from '../../../DataContext';
import { addLog } from '../../../logService';

const SettingsScreen = ({ onLogout }) => {
  const { 
    isDarkThemeEnabled, 
    setIsDarkThemeEnabled, 
    isNotificationsEnabled, 
    setIsNotificationsEnabled,
    isAutoLoginEnabled,
    setIsAutoLoginEnabled // DataContext의 자동 로그인 설정 함수
  } = useContext(DataContext);

  const toggleNotifications = () => setIsNotificationsEnabled(!isNotificationsEnabled);
  const toggleDarkTheme = () => setIsDarkThemeEnabled(!isDarkThemeEnabled);
  const toggleAutoLogin = () => setIsAutoLoginEnabled(!isAutoLoginEnabled);

  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        await addLog('설정 페이지에 방문했습니다.');
      };
      logVisit();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('로그아웃', '성공적으로 로그아웃되었습니다.', [
      {
        text: '확인',
        onPress: async () => {
          await onLogout(); // 직접 Logout을 호출하여 상태 변경
        },
      },
    ]);
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' }
    ]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Divider style={{ backgroundColor: isDarkThemeEnabled ? '#555' : '#ccc' }} />
        
        <List.Item
          title="알림 설정"
          description="앱 알림을 켜거나 끕니다."
          titleStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          descriptionStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="bells" size={24} color={isDarkThemeEnabled ? '#fff' : '#000'} />
            </View>
          )}
          right={() => <Switch value={isNotificationsEnabled} onValueChange={toggleNotifications} />}
          style={[
            styles.listItem,
            { backgroundColor: isDarkThemeEnabled ? '#444' : '#f8f8f8' }
          ]}
        />
        <Divider style={{ backgroundColor: isDarkThemeEnabled ? '#555' : '#ccc' }} />

        <List.Item
          title="앱 테마 변경"
          description="다크 모드를 켜거나 끕니다."
          titleStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          descriptionStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="bulb1" size={24} color={isDarkThemeEnabled ? '#fff' : '#000'} />
            </View>
          )}
          right={() => <Switch value={isDarkThemeEnabled} onValueChange={toggleDarkTheme} />}
          style={[
            styles.listItem,
            { backgroundColor: isDarkThemeEnabled ? '#444' : '#f8f8f8' }
          ]}
        />
        <Divider style={{ backgroundColor: isDarkThemeEnabled ? '#555' : '#ccc' }} />

        <List.Item
          title="자동 로그인 설정"
          description="자동 로그인을 설정합니다."
          titleStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          descriptionStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="login" size={24} color={isDarkThemeEnabled ? '#fff' : '#000'} />
            </View>
          )}
          right={() => <Switch value={isAutoLoginEnabled} onValueChange={toggleAutoLogin} />}
          style={[
            styles.listItem,
            { backgroundColor: isDarkThemeEnabled ? '#444' : '#f8f8f8' }
          ]}
        />
        <Divider style={{ backgroundColor: isDarkThemeEnabled ? '#555' : '#ccc' }} />

        <List.Item
          title="앱 버전 정보"
          description="현재 앱 버전을 확인합니다."
          titleStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          descriptionStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="infocirlceo" size={24} color={isDarkThemeEnabled ? '#fff' : '#000'} />
            </View>
          )}
          onPress={() => Alert.alert('앱 버전', '현재 앱 버전: 1.0.0')}
          style={[
            styles.listItem,
            { backgroundColor: isDarkThemeEnabled ? '#444' : '#f8f8f8' }
          ]}
        />
        <Divider style={{ backgroundColor: isDarkThemeEnabled ? '#555' : '#ccc' }} />

        <Button
          mode="contained"
          onPress={handleLogout}
          style={[
            styles.logoutbutton,
          ]}
          labelStyle={{ fontSize: 16 }}
        >
          로그아웃
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  iconContainer: { justifyContent: 'center', alignItems: 'center', width: 40 },
  listItem: { marginTop: 15, marginBottom: 15, paddingHorizontal: 10, borderRadius: 10 },
  logoutbutton: { width: '100%', paddingVertical: 10, borderRadius: 10, marginTop: 20, backgroundColor:'#d95e53' },
});

export default SettingsScreen;
