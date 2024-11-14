//App.js
import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity, StatusBar } from 'react-native';
import { Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomePage from './page/HomePage';
import LoginPage from './page/LoginPage';
import DocumentViewer from './page/tabs/home/detail/viewer/DocumentViewer';
import { DataProvider, DataContext } from './DataContext';
import * as SplashScreen from 'expo-splash-screen';

const Stack = createStackNavigator();

function App() {
  const { identifier, password, isAutoLoginEnabled, saveCredentials, clearCredentials, isDarkThemeEnabled } = useContext(DataContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        if (isAutoLoginEnabled && identifier && password) {
          await handleLogin(identifier, password, true);
        }
      } catch (error) {
        console.error('앱 준비 중 오류 발생:', error);
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, [isAutoLoginEnabled, identifier, password]);

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
                options={({ navigation }) => ({
                  headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                      <Ionicons name="arrow-back" size={24} color={isDarkThemeEnabled ? "#fff" : "#333"} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                  ),
                  headerTitle: "", // 제목 숨김
                })}
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
