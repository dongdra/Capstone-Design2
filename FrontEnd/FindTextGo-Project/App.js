//App.js
import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity, StatusBar, BackHandler, Platform } from 'react-native';
import { Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomePage from './page/HomePage';
import LoginPage from './page/LoginPage';
import DocumentViewer from './page/tabs/home/detail/viewer/DocumentViewer';
import { DataProvider, DataContext } from './DataContext';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';

const Stack = createStackNavigator();

function App() {
  const { identifier, password, isAutoLoginEnabled, saveCredentials, clearCredentials, isDarkThemeEnabled, isNotificationsEnabled  } = useContext(DataContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // SplashScreen 초기화
        await SplashScreen.preventAutoHideAsync();
  
        if (isAutoLoginEnabled && identifier && password) {
          await handleLogin(identifier, password, true);
        }
      } catch (error) {
        console.error('앱 준비 중 오류 발생:', error);
      } finally {
        setLoading(false);
        // SplashScreen 숨김
        await SplashScreen.hideAsync();
      }
    };
    prepareApp();
  }, [isAutoLoginEnabled, identifier, password]);

  useEffect(() => {
    const backAction = () => {
      // 아무것도 하지 않음 (뒤로가기 버튼 비활성화)
      return true; // 기본 동작 무시
    };
  
    // 이벤트 리스너 추가
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
  
    return () => {
      // 이벤트 리스너 제거
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    const manageScreenCapture = async () => {
      try {
        if (Platform.OS === 'android' && isNotificationsEnabled) {
          await ScreenCapture.preventScreenCaptureAsync(); // Android: 화면 캡처 방지
        } else if (Platform.OS === 'android') {
          await ScreenCapture.allowScreenCaptureAsync(); // Android: 방지 해제
        }
      } catch (error) {
        console.error('화면 캡처 설정 중 오류 발생:', error);
      }
    };
  
    manageScreenCapture();
  }, [isNotificationsEnabled]);
  
  useEffect(() => {
    const handleScreenshot = async () => {
      if (Platform.OS === 'ios' && isNotificationsEnabled) { // iOS 및 알림 활성화 조건
        try {
          Alert.alert('경고', '화면 캡처가 감지되어 로그아웃됩니다.');
          await handleLogout(); // 로그아웃 처리
        } catch (error) {
          console.error('iOS 화면 캡처 처리 중 오류 발생:', error);
        }
      }
    };
  
    if (Platform.OS === 'ios') {
      const screenshotListener = ScreenCapture.addScreenshotListener(handleScreenshot);
      return () => {
        screenshotListener.remove(); // iOS 리스너 제거
      };
    }
  }, [isNotificationsEnabled, handleLogout]);

  const handleLogin = async (identifier, password, isAutoLogin = false) => {
    try {
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
    <Provider>
      <NavigationContainer>
        {/* StatusBar 설정: 다크 모드에 따라 스타일 변경 */}
        <StatusBar
          barStyle={isDarkThemeEnabled ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkThemeEnabled ? '#333' : '#fff'}
        />

        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' },
            headerTintColor: isDarkThemeEnabled ? '#fff' : '#333',
          }}
        >
          {isLoggedIn ? (
            <>
 <Stack.Screen
  name="HomePage"
  options={{
    headerTitle: () => (
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: isDarkThemeEnabled ? "#ffffff" : "#333333",
          marginLeft: Platform.OS === "ios" ? 10 : 0, // 플랫폼별 마진 조정
        }}
      >
        FindTextGo
      </Text>
    ),
    headerTitleAlign: "left", // 모든 플랫폼에서 왼쪽 정렬
  }}
>
  {() => <HomePage onLogout={handleLogout} />}
</Stack.Screen>

              <Stack.Screen
                name="DocumentViewer"
                component={DocumentViewer}
                options={({ navigation }) => ({
                  headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                      <Ionicons name="arrow-back" size={24} color={isDarkThemeEnabled ? "#fff" : "#333"} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                  ),
                  headerTitle: "", // 제목 숨김
                })}
              />
            </>
          ) : (
            <Stack.Screen name="LoginPage" options={{ headerShown: false }}>
              {() => <LoginPage onLogin={handleLogin} storedCredentials={{ identifier, password }} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function MainApp() {
  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
}
