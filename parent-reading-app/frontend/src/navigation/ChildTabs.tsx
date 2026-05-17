/**
 * 儿童端底部Tab导航
 *
 * 设计理念：大图标、大字体、卡通风格、操作简单
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import ChildHomeScreen from '../screens/Child/ChildHomeScreen';
import ChildPlayerScreen from '../screens/Child/ChildPlayerScreen';
import ChildFavoritesScreen from '../screens/Child/ChildFavoritesScreen';

const Tab = createBottomTabNavigator();

export default function ChildTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFF8E7',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          elevation: 10,
        },
        tabBarActiveTintColor: '#FF8C42',
        tabBarInactiveTintColor: '#C4A882',
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: 'bold',
        },
        headerStyle: {
          backgroundColor: '#FF8C42',
          elevation: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}
    >
      <Tab.Screen
        name="ChildHome"
        component={ChildHomeScreen}
        options={{
          title: '故事屋',
          headerTitle: '✨ 故事屋 ✨',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28 }}>🏡</Text>,
        }}
      />
      <Tab.Screen
        name="ChildPlayer"
        component={ChildPlayerScreen}
        options={{
          title: '听一听',
          headerTitle: '🎧 听一听',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28 }}>▶️</Text>,
        }}
      />
      <Tab.Screen
        name="ChildFavorites"
        component={ChildFavoritesScreen}
        options={{
          title: '我喜欢',
          headerTitle: '❤️ 我喜欢',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28 }}>⭐</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
