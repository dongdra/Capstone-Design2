// DataContext.js
import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [identifier, setIdentifier] = useState(null);
  const [password, setPassword] = useState(null);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedIdentifier = await SecureStore.getItemAsync('identifier');
        const storedPassword = await SecureStore.getItemAsync('password');
        const autoLoginStatus = await SecureStore.getItemAsync('isAutoLoginEnabled');
        const themeStatus = await SecureStore.getItemAsync('isDarkThemeEnabled');
        const notificationsStatus = await SecureStore.getItemAsync('isNotificationsEnabled');

        if (storedIdentifier && storedPassword) {
          setIdentifier(storedIdentifier);
          setPassword(storedPassword);
          setIsAutoLoginEnabled(autoLoginStatus === 'true');
        }
        
        setIsDarkThemeEnabled(themeStatus === 'true');
        setIsNotificationsEnabled(notificationsStatus === 'true');
      } catch (error) {
        console.error('설정 로드 중 오류 발생:', error);
      } finally {
        setLoading(false); // 로딩이 완료되면 loading을 false로 설정
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!loading) { 
      console.log('Current Settings:', {
        identifier,
        password,
        isDarkThemeEnabled,
        isNotificationsEnabled,
        isAutoLoginEnabled,
      });
    }
  }, [identifier, password, isDarkThemeEnabled, isNotificationsEnabled, isAutoLoginEnabled, loading]);

  // 자격증명 및 설정 저장 함수
  const saveCredentials = async (newIdentifier, newPassword, autoLogin = false) => {
    try {
      await SecureStore.setItemAsync('identifier', newIdentifier);
      await SecureStore.setItemAsync('password', newPassword);
      await SecureStore.setItemAsync('isAutoLoginEnabled', autoLogin ? 'true' : 'false');

      setIdentifier(newIdentifier);
      setPassword(newPassword);
      setIsAutoLoginEnabled(autoLogin);
    } catch (error) {
      console.error('자격 증명 저장 중 오류 발생:', error);
    }
  };

  const saveThemePreference = async (isEnabled) => {
    try {
      await SecureStore.setItemAsync('isDarkThemeEnabled', isEnabled ? 'true' : 'false');
      setIsDarkThemeEnabled(isEnabled);
    } catch (error) {
      console.error('테마 설정 저장 중 오류 발생:', error);
    }
  };

  const saveNotificationsPreference = async (isEnabled) => {
    try {
      await SecureStore.setItemAsync('isNotificationsEnabled', isEnabled ? 'true' : 'false');
      setIsNotificationsEnabled(isEnabled);
    } catch (error) {
      console.error('알림 설정 저장 중 오류 발생:', error);
    }
  };

  // 자동 로그인 설정 저장 함수 추가
  const saveAutoLoginPreference = async (isEnabled) => {
    try {
      await SecureStore.setItemAsync('isAutoLoginEnabled', isEnabled ? 'true' : 'false');
      setIsAutoLoginEnabled(isEnabled);
    } catch (error) {
      console.error('자동 로그인 설정 저장 중 오류 발생:', error);
    }
  };

  // 자격증명 삭제 함수
  const clearCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync('identifier');
      await SecureStore.deleteItemAsync('password');
      await SecureStore.deleteItemAsync('isAutoLoginEnabled');
      await SecureStore.deleteItemAsync('isDarkThemeEnabled');
      await SecureStore.deleteItemAsync('isNotificationsEnabled');

      setIdentifier(null);
      setPassword(null);
      setIsAutoLoginEnabled(false);
      setIsDarkThemeEnabled(false);
      setIsNotificationsEnabled(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DataContext.Provider value={{
      isDarkThemeEnabled,
      setIsDarkThemeEnabled: saveThemePreference,
      isNotificationsEnabled,
      setIsNotificationsEnabled: saveNotificationsPreference,
      isAutoLoginEnabled,
      setIsAutoLoginEnabled: saveAutoLoginPreference, // 저장 함수로 연결
      identifier,
      password,
      saveCredentials,
      clearCredentials,
    }}>
      {children}
    </DataContext.Provider>
  );
};
