// LogRecordScreen.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import ActivityLogScreen from './topbar/ActivityLogScreen';
import FavoritesScreen from './topbar/FavoritesScreen';

const Tab = createMaterialTopTabNavigator();

const LogRecordScreen = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarLabelStyle: { fontSize: 16 },
      tabBarStyle: { backgroundColor: '#A4A4A4' },
      tabBarIndicatorStyle: { backgroundColor: '#fff', height: 3 },
    }}
  >
    <Tab.Screen name="활동로그" component={ActivityLogScreen} />
    <Tab.Screen name="즐겨찾기" component={FavoritesScreen} />
  </Tab.Navigator>
);

export default LogRecordScreen;
