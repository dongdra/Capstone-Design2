// App.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-native-paper';
import Home from './Pages/Home';
import LoginPage from './Pages/LoginPage';
import { NavigationContainer } from '@react-navigation/native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 여부 관리

  const handleLogin = () => {
    setIsLoggedIn(true); // 로그인 성공 시 Home으로 이동
  };

  return (
    <NavigationContainer>
      <Provider>
        <View style={styles.container}>
          {isLoggedIn ? (
            <Home />  // 로그인 후 Home 화면 표시
          ) : (
            <LoginPage onLogin={handleLogin} />  // 로그인 화면 표시
          )}
        </View>
      </Provider>
    </NavigationContainer>
  );
}

