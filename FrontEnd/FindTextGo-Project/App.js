// App.js
import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Provider } from 'react-native-paper';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import HomePage from './page/HomePage';
import LoginPage from './page/LoginPage';
import DocumentViewer from './page/tabs/home/detail/viewer/DocumentViewer';
import { DataProvider, DataContext } from './DataContext';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';

const Stack = createStackNavigator();

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storedCredentials, setStoredCredentials] = useState(null);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(false);
  
  // 스크린 캡처 방지 설정 변수
  const isScreenCapturePrevented = true; // 필요에 따라 true 또는 false로 설정
  
  const { isDarkThemeEnabled } = useContext(DataContext);

  // 앱 준비 및 자격 증명 로드
  useEffect(() => {
    const prepareApp = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();

        const storedIdentifier = await SecureStore.getItemAsync('identifier');
        const storedPassword = await SecureStore.getItemAsync('password');
        const autoLoginStatus = await SecureStore.getItemAsync('isAutoLoginEnabled');

        if (
          autoLoginStatus === 'true' &&
          storedIdentifier &&
          storedPassword &&
          storedIdentifier !== "null" &&
          storedPassword !== "null"
        ) {
          setStoredCredentials({ identifier: storedIdentifier, password: storedPassword });
          setIsAutoLoginEnabled(true);
        }

        // 스크린 캡처 방지 설정 및 해제
        if (isScreenCapturePrevented) {
          // 스크린 캡처 방지 활성화
          if (Platform.OS === 'android') {
            await ScreenCapture.preventScreenCaptureAsync();
          } else {
            ScreenCapture.addScreenshotListener(() => {
              handleLogout(); // iOS의 경우 스크린샷 찍히면 로그아웃
              Alert.alert(
                '경고',
                '스크린샷이 감지되어 로그아웃됩니다.',
                [{ text: '확인' }]
              );
            });
          }
        } else {
          // 스크린 캡처 방지 비활성화
          await ScreenCapture.allowScreenCaptureAsync();
          if (Platform.OS === 'ios') {
            ScreenCapture.removeScreenshotListener();
          }
        }
      } catch (error) {
        console.error('자동 로그인 확인 중 오류 발생:', error);
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    };
    prepareApp();

    return () => {
      if (Platform.OS === 'ios' && isScreenCapturePrevented) {
        ScreenCapture.removeScreenshotListener();
      }
    };
  }, []);

  // 자동 로그인 조건을 충족할 경우 로그인 시도
  useEffect(() => {
    if (isAutoLoginEnabled && storedCredentials) {
      handleLogin(storedCredentials.identifier, storedCredentials.password, true);
    }
  }, [isAutoLoginEnabled, storedCredentials]);

  const handleLogin = async (identifier, password, isAutoLogin = false) => {
    try {
      await SecureStore.setItemAsync('identifier', identifier);
      await SecureStore.setItemAsync('password', password);

      if (!isAutoLogin) {
        await SecureStore.setItemAsync('isAutoLoginEnabled', 'true');
      }

      setIsLoggedIn(true);
    } catch (error) {
      console.error('로그인 처리 중 오류 발생:', error);
      Alert.alert('오류', '로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('identifier');
      await SecureStore.deleteItemAsync('password');
      await SecureStore.deleteItemAsync('isAutoLoginEnabled');
      setStoredCredentials(null);
      setIsAutoLoginEnabled(false);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('로그아웃 처리 중 오류 발생:', error);
      Alert.alert('오류', '로그아웃 처리 중 문제가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={isDarkThemeEnabled ? DarkTheme : DefaultTheme}>
      <Provider>
        <Stack.Navigator>
          {isLoggedIn ? (
            <Stack.Screen
              name="HomePage"
              options={({ navigation }) => ({
                title: '',
                headerLeft: () => (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={25}
                      color={isDarkThemeEnabled ? "#fff" : "#333"}
                      style={{ marginLeft: 10 }}
                    />
                  </TouchableOpacity>
                ),
              })}
            >
              {() => <HomePage onLogout={handleLogout} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="LoginPage" options={{ headerShown: false }}>
              {() => (
                <LoginPage
                  onLogin={handleLogin}
                  storedCredentials={storedCredentials}
                />
              )}
            </Stack.Screen>
          )}
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewer}
            options={{ title: '문서 페이지' }}
          />
        </Stack.Navigator>
      </Provider>
    </NavigationContainer>
  );
}

export default function MainApp() {
  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
}
