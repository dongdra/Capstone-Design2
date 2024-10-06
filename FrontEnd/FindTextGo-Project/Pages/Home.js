// Home.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign } from '@expo/vector-icons'; // AntDesign 아이콘 추가
import { Platform } from 'react-native'; // 추가
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

export default function Home({ onLogout }) {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home'; // AntDesign에서 home 아이콘 사용
          } else if (route.name === 'Profile') {
            iconName = 'user'; // AntDesign에서 user 아이콘 사용
          } else if (route.name === 'Settings') {
            iconName = 'setting'; // AntDesign에서 setting 아이콘 사용
          }
          return <AntDesign name={iconName} size={size} color={color} />; // AntDesign으로 변경
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: Platform.OS === 'android' ? 50 : 75, 
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E6E6E6',
        },
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필' }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈' }} />     
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
