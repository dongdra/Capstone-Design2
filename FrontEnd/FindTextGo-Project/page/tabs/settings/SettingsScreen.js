// SettingsScreen.js
import React, { useContext, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Divider, Switch, List } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { DataContext } from '../../../DataContext';
import { addLog } from '../../../logService';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  iconContainer: { justifyContent: 'center', alignItems: 'center', width: 40 },
  listItem: { marginTop: 15, marginBottom: 15, paddingHorizontal: 10, borderRadius: 10 },
  logoutbutton: { width: '100%', paddingVertical: 15, borderRadius: 10, marginTop: 30, backgroundColor: '#d95e53' },
});

const SettingsScreen = ({ onLogout }) => {
  const {
    identifier,
    isDarkThemeEnabled,
    setIsDarkThemeEnabled,
    isNotificationsEnabled,
    setIsNotificationsEnabled,
    isAutoLoginEnabled,
    setIsAutoLoginEnabled
  } = useContext(DataContext);

  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        if (!identifier) {
          console.error("Identifier is required to add a log.");
          return;
        }
        await addLog(identifier, '설정 페이지에 접속했습니다.');
      };
      logVisit();
    }, [identifier])
  );

  const toggleNotifications = () => {
    setIsNotificationsEnabled(!isNotificationsEnabled);
    Toast.show({
      type: 'success',
      text1: '보안 설정이 변경되었습니다.',
      text2: isNotificationsEnabled ? '보안이 꺼졌습니다.' : '보안이 켜졌습니다.',
      position: 'top',
    });
  };
  const toggleDarkTheme = () => {
    setIsDarkThemeEnabled(!isDarkThemeEnabled);
    Toast.show({
      type: 'success',
      text1: '테마가 변경되었습니다.',
      text2: isDarkThemeEnabled ? '라이트 모드로 변경되었습니다.' : '다크 모드로 변경되었습니다.',
      position: 'top',
    });
  };

  const toggleAutoLogin = () => {
    setIsAutoLoginEnabled(!isAutoLoginEnabled);
    Toast.show({
      type: 'success',
      text1: '자동 로그인 설정이 변경되었습니다.',
      text2: isAutoLoginEnabled ? '자동 로그인이 비활성화되었습니다.' : '자동 로그인이 활성화되었습니다.',
      position: 'top',
    });
  };

  const appInfo = {
    name: Constants.expoConfig?.name || Constants.name || '알 수 없음',
    version: Constants.expoConfig?.version || Constants.version || '알 수 없음',
    sdkVersion: Constants.expoConfig?.sdkVersion || Constants.sdkVersion || '알 수 없음',
  };

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
          title="보안 설정"
          description="앱의 보안성을 켜거나 끕니다."
          titleStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          descriptionStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="warning" size={24} color={isDarkThemeEnabled ? '#fff' : '#000'} />
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
          title="앱 정보"
          description={`현재 앱 버전: ${appInfo.version}`} // 간단한 정보 표시
          titleStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          descriptionStyle={{ color: isDarkThemeEnabled ? '#bbb' : '#555' }}
          left={() => (
            <View style={styles.iconContainer}>
              <AntDesign name="infocirlceo" size={24} color={isDarkThemeEnabled ? '#fff' : '#000'} />
            </View>
          )}
          onPress={() => {
            Alert.alert(
              '앱 정보',
              `앱 이름: ${appInfo.name}\n버전: ${appInfo.version}\nSDK 버전: ${appInfo.sdkVersion}`
            );
          }}
          style={[
            styles.listItem,
            { backgroundColor: isDarkThemeEnabled ? '#444' : '#f8f8f8' }
          ]}
        />
        <Divider style={{ backgroundColor: isDarkThemeEnabled ? '#555' : '#ccc' }} />

        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.logoutbutton,
          ]}
        >
          <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast topOffset={10} />
    </View>
  );
};



export default SettingsScreen;
