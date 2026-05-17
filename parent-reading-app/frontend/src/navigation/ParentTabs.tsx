/**
 * 家长端底部Tab导航
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/Parent/HomeScreen';
import RecordingScreen from '../screens/Parent/RecordingScreen';
import ContentLibraryScreen from '../screens/Parent/ContentLibraryScreen';
import ProfileScreen from '../screens/Parent/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999999',
        headerStyle: {
          backgroundColor: '#FF6B6B',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          headerTitle: '亲子伴读',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Recording"
        component={RecordingScreen}
        options={{
          title: '录音',
          headerTitle: '声音录制',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎙️</Text>,
        }}
      />
      <Tab.Screen
        name="Library"
        component={ContentLibraryScreen}
        options={{
          title: '内容库',
          headerTitle: '内容库',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📚</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          headerTitle: '个人中心',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
