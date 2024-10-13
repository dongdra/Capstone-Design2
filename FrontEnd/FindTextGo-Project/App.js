// App.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Provider } from 'react-native-paper';
import Home from './Pages/Home';
import LoginPage from './Pages/LoginPage';
import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 여부를 확인하는 상태
  const [loading, setLoading] = useState(true);  // 데이터를 불러오는 동안의 로딩 상태
  const [storedCredentials, setStoredCredentials] = useState(null); // 저장된 자격증명 상태 추가

  // 자동로그인 여부 확인하는 변수 추가
const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(false);

useEffect(() => {
  const checkStoredCredentials = async () => {
    const storedIdentifier = await SecureStore.getItemAsync('identifier');
    const storedPassword = await SecureStore.getItemAsync('password');
    const autoLoginStatus = await SecureStore.getItemAsync('isAutoLoginEnabled'); // 자동로그인 여부 확인

    if (autoLoginStatus === 'true' && storedIdentifier && storedPassword) {
      setStoredCredentials({ identifier: storedIdentifier, password: storedPassword });
      setIsAutoLoginEnabled(true); // 자동로그인이 활성화된 경우
    }

    setLoading(false);
  };
  checkStoredCredentials();
}, []);

// 자동로그인이 활성화된 경우에만 로그인 시도
useEffect(() => {
  if (isAutoLoginEnabled && storedCredentials) {
    handleLogin(storedCredentials.identifier, storedCredentials.password);
  }
}, [isAutoLoginEnabled, storedCredentials]);
  
   // 사용자가 로그인하면 호출되는 함수
  const handleLogin = async (identifier, password) => {
    await SecureStore.setItemAsync('identifier', identifier);
    await SecureStore.setItemAsync('password', password);
    setIsLoggedIn(true);   // 로그인 상태로 전환
  };

// 사용자가 로그아웃하면 호출되는 함수
const handleLogout = async () => {
  await SecureStore.deleteItemAsync('identifier');
  await SecureStore.deleteItemAsync('password');
  await SecureStore.deleteItemAsync('isAutoLoginEnabled'); // 자동로그인 상태도 삭제
  setStoredCredentials(null);  // 자격증명을 초기화
  setIsAutoLoginEnabled(false); // 자동로그인 상태 초기화
  setIsLoggedIn(false);   // 로그아웃 상태로 전환
};

  // 데이터를 불러오는 동안 보여줄 로딩 화면
  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <NavigationContainer>
      <Provider>
        <View style={styles.container}>
          {isLoggedIn ? (
             // 로그인 상태일 때 Home 컴포넌트를 렌더링
            <Home onLogout={handleLogout} />  // 로그아웃 시 Home에서 처리
          ) : (
            // 로그인하지 않은 상태일 때 LoginPage 컴포넌트를 렌더링
            <LoginPage 
              onLogin={handleLogin}  // LoginPage에 handleLogin 함수를 전달
              storedCredentials={storedCredentials} // 저장된 자격증명을 LoginPage로 전달(자동로그인)
            />  
          )}
        </View>
      </Provider>
    </NavigationContainer>
  );
}
