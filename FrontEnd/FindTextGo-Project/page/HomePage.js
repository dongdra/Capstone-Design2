// HomePage.js
import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import HomeScreen from './tabs/home/HomeScreen';
import FavoritesScreen from './tabs/bookmark/FavoritesScreen';
import LogRecordScreen from './tabs/logrecord/LogRecordScreen';
import ProfileScreen from './tabs/profile/ProfileScreen';
import SettingsScreen from './tabs/settings/SettingsScreen';
import { DataContext } from '../DataContext'; // 다크 모드 설정 상태를 가져오기 위한 import

const Tab = createBottomTabNavigator();

export default function Home({ onLogout }) {
  const { isDarkThemeEnabled } = useContext(DataContext); // 다크 모드 상태 가져오기

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = 'home';
              } else if (route.name === 'Profile') {
                iconName = 'user';
              } else if (route.name === 'Settings') {
                iconName = 'setting';
              } else if (route.name === 'LogRecord') {
                iconName = 'appstore-o';
              } else if (route.name === 'BookMark') {
                iconName = 'book';
              }

              return <AntDesign name={iconName} size={size} color={color} />;
            },
            tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: isDarkThemeEnabled ? '#fff' : 'black',
            tabBarInactiveTintColor: isDarkThemeEnabled ? '#888' : 'gray',
            tabBarStyle: {
              height: Platform.OS === 'android' ? 50 : 75,
              backgroundColor: isDarkThemeEnabled ? '#333' : '#ffffff',
              borderTopWidth: 1,
              borderTopColor: isDarkThemeEnabled ? '#444' : '#E6E6E6',
            },
            headerShown: false,
          })}
        >
          <Tab.Screen name="BookMark" component={FavoritesScreen} options={{ tabBarLabel: '즐겨찾기' }} />
          <Tab.Screen name="LogRecord" component={LogRecordScreen} options={{ tabBarLabel: '기록' }} />
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈' }} />
          <Tab.Screen name="Profile"options={{ tabBarLabel: '프로필' }}>
            {() => <ProfileScreen onLogout={onLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Settings" options={{ tabBarLabel: '설정' }}>
            {() => <SettingsScreen onLogout={onLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
    </KeyboardAvoidingView>
  );
}
