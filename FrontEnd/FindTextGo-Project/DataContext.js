// DataContext.js
import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [identifier, setIdentifier] = useState(null);
  const [password, setPassword] = useState(null);
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedIdentifier = await SecureStore.getItemAsync('identifier');
        const storedPassword = await SecureStore.getItemAsync('password');
        const storedName = await SecureStore.getItemAsync('name');
        const storedEmail = await SecureStore.getItemAsync('email');
        const autoLoginStatus = await SecureStore.getItemAsync('isAutoLoginEnabled');
        const themeStatus = await SecureStore.getItemAsync('isDarkThemeEnabled');
        const notificationsStatus = await SecureStore.getItemAsync('isNotificationsEnabled');

        if (storedIdentifier && storedPassword) {
          setIdentifier(storedIdentifier);
          setPassword(storedPassword);
          setIsAutoLoginEnabled(autoLoginStatus === 'true');
        }
        if (storedName && storedEmail) {
          setName(storedName);
          setEmail(storedEmail);
        }

        setIsDarkThemeEnabled(themeStatus === 'true');
        setIsNotificationsEnabled(notificationsStatus === 'true');
      } catch (error) {
        console.error('설정 로드 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!loading) { 
      console.log('Current Settings:', {
        identifier,
        password,
        name,
        email,
        isDarkThemeEnabled,
        isNotificationsEnabled,
        isAutoLoginEnabled,
      });
    }
  }, [identifier, password, name, email, isDarkThemeEnabled, isNotificationsEnabled, isAutoLoginEnabled, loading]);

  // 자격증명 저장 함수 (identifier와 password만 저장)
  const saveCredentials = async (newIdentifier, newPassword, autoLogin = false) => {
    try {
      console.log("저장할 자격증명:", { newIdentifier, newPassword, autoLogin });
      await SecureStore.setItemAsync('identifier', String(newIdentifier));
      await SecureStore.setItemAsync('password', String(newPassword));
      await SecureStore.setItemAsync('isAutoLoginEnabled', autoLogin ? 'true' : 'false');

      setIdentifier(newIdentifier);
      setPassword(newPassword);
      setIsAutoLoginEnabled(autoLogin);
    } catch (error) {
      console.error('자격 증명 저장 중 오류 발생:', error);
    }
  };

  // 사용자 정보 저장 함수 (name과 email만 저장)
  const saveUserInfo = async (newName, newEmail) => {
    try {
      console.log("저장할 사용자 정보:", { newName, newEmail });
      await SecureStore.setItemAsync('name', String(newName));
      await SecureStore.setItemAsync('email', String(newEmail));

      setName(newName);
      setEmail(newEmail);
    } catch (error) {
      console.error('사용자 정보 저장 중 오류 발생:', error);
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

  const saveAutoLoginPreference = async (isEnabled) => {
    try {
      await SecureStore.setItemAsync('isAutoLoginEnabled', isEnabled ? 'true' : 'false');
      setIsAutoLoginEnabled(isEnabled);
    } catch (error) {
      console.error('자동 로그인 설정 저장 중 오류 발생:', error);
    }
  };

  const clearCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync('identifier');
      await SecureStore.deleteItemAsync('password');
      await SecureStore.deleteItemAsync('name');
      await SecureStore.deleteItemAsync('email');
      await SecureStore.deleteItemAsync('isAutoLoginEnabled');
      await SecureStore.deleteItemAsync('isDarkThemeEnabled');
      await SecureStore.deleteItemAsync('isNotificationsEnabled');

      setIdentifier(null);
      setPassword(null);
      setName(null);
      setEmail(null);
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
      setIsAutoLoginEnabled: saveAutoLoginPreference,
      identifier,
      password,
      name,
      email,
      saveCredentials,
      saveUserInfo, // 추가된 함수
      clearCredentials,
    }}>
      {children}
    </DataContext.Provider>
  );
};
