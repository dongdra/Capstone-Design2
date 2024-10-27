// Home.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import HomeScreen from './HomeScreen';
import LogRecordScreen from './LogRecordScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

export default function Home({ onLogout }) {


  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // iOS의 경우 여백 조정
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
            }
            
            return <AntDesign name={iconName} size={size} color={color} />;
          },
          tabBarHideOnKeyboard:true, 
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            height: Platform.OS === 'android' ? 50 : 75, 
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#E6E6E6',
          },
          headerShown: false, // 기본 상단바를 숨기기 위해 추가
        })}
      >
        <Tab.Screen name="LogRecord" component={LogRecordScreen} options={{ tabBarLabel: '기록' }} />
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈' }} />  
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필' }} />   
        <Tab.Screen name="Settings">
          {() => <SettingsScreen onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
     </KeyboardAvoidingView>
  );
}
