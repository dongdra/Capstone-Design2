import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomePage from './page/HomePage';
import LoginPage from './page/LoginPage';
import DocumentViewer from './page/tabs/home/detail/viewer/DocumentViewer';
import { DataProvider, DataContext } from './DataContext';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'react-native';
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
  const { 
    identifier, 
    password, 
    isAutoLoginEnabled, 
    saveCredentials, 
    clearCredentials, 
    isDarkThemeEnabled 
  } = useContext(DataContext);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const screenshotListener = useRef(null);

  // 스크린 캡처 방지 설정 변수
  const isScreenCapturePrevented = true;

  useEffect(() => {
    let isMounted = true;

    const setupScreenCapture = async () => {
      if (isScreenCapturePrevented) {
        if (Platform.OS === 'android') {
          try {
            await ScreenCapture.preventScreenCaptureAsync();
          } catch (error) {
            console.error('Android screen capture prevention error:', error);
          }
        } else if (Platform.OS === 'ios') {
          try {
            // iOS에서는 리스너만 추가
            screenshotListener.current = ScreenCapture.addScreenshotListener(() => {
              if (isMounted) {
                handleLogout();
                Alert.alert(
                  '경고',
                  '스크린샷이 감지되어 로그아웃됩니다.',
                  [{ text: '확인' }]
                );
              }
            });
          } catch (error) {
            console.error('iOS screenshot listener error:', error);
          }
        }
      }
    };

    const prepareApp = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();

        // 스크린 캡처 설정
        await setupScreenCapture();

        // 자동 로그인 처리
        if (
          isAutoLoginEnabled &&
          identifier &&
          password &&
          identifier !== "null" &&
          password !== "null"
        ) {
          await handleLogin(identifier, password, true);
        }
      } catch (error) {
        console.error('앱 준비 중 오류 발생:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          await SplashScreen.hideAsync();
        }
      }
    };

    prepareApp();

    // Cleanup function
    return () => {
      isMounted = false;
      if (Platform.OS === 'ios' && screenshotListener.current) {
        screenshotListener.current.remove();
        screenshotListener.current = null;
      }
    };
  }, [isAutoLoginEnabled, identifier, password]);

  const handleLogin = async (identifier, password, isAutoLogin = false) => {
    try {
      // 자격 증명 저장 전에 유효성 검사
      if (!identifier || !password) {
        throw new Error('Invalid credentials');
      }
      
      // 자격 증명 저장
      await saveCredentials(identifier, password, isAutoLogin);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('로그인 처리 중 오류 발생:', error);
      Alert.alert('오류', '로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleLogout = async () => {
    try {
      await clearCredentials();
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
    <>
      <StatusBar
        barStyle={isDarkThemeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkThemeEnabled ? '#333' : '#fff'}
      />
      <NavigationContainer>
        <Provider>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: isDarkThemeEnabled ? '#333' : '#fff',
              },
              headerTintColor: isDarkThemeEnabled ? '#fff' : '#333',
            }}
          >
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
                    storedCredentials={{ identifier, password }}
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
    </>
  );
}

export default function MainApp() {
  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
}