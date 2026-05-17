/**
 * 根导航器
 *
 * 根据登录状态和模式切换不同的导航栈：
 * - 未登录 → AuthStack
 * - 家长模式 → ParentTabs
 * - 儿童模式 → ChildTabs
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import ParentTabs from './ParentTabs';
import ChildTabs from './ChildTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoggedIn, currentMode } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : currentMode === 'child' ? (
        <Stack.Screen name="Child" component={ChildTabs} />
      ) : (
        <Stack.Screen name="Parent" component={ParentTabs} />
      )}
    </Stack.Navigator>
  );
}
