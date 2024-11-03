// App.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import HomePage from './page/HomePage';
import LoginPage from './page/LoginPage';
import DocumentViewer from './page/tabs/home/detail/viewer/DocumentViewer';
import { DataProvider } from './DataContext';
import * as SplashScreen from 'expo-splash-screen';

const Stack = createStackNavigator();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storedCredentials, setStoredCredentials] = useState(null);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // 스플래시 화면 유지
        await SplashScreen.preventAutoHideAsync();

        const storedIdentifier = await SecureStore.getItemAsync('identifier');
        const storedPassword = await SecureStore.getItemAsync('password');
        const autoLoginStatus = await SecureStore.getItemAsync('isAutoLoginEnabled');

        if (autoLoginStatus === 'true' && storedIdentifier && storedPassword) {
          setStoredCredentials({ identifier: storedIdentifier, password: storedPassword });
          setIsAutoLoginEnabled(true);
        }
      } catch (error) {
        console.error('자동 로그인 확인 중 오류 발생:', error);
      } finally {
        setLoading(false);
        // 로딩이 완료되면 스플래시 화면 숨기기
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

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
        await SecureStore.setItemAsync('isAutoLoginEnabled', 'true'); // 자동 로그인 설정
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
    <NavigationContainer>
      <DataProvider>
        <Provider>
          <Stack.Navigator>
            {isLoggedIn ? (
              <Stack.Screen
                name="HomePage"
                options={{ title: '' }}
              >
                {() => <HomePage onLogout={handleLogout} />}
              </Stack.Screen>
            ) : (
              <Stack.Screen
                name="LoginPage"
                options={{ headerShown: false }}
              >
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
      </DataProvider>
    </NavigationContainer>
  );
}