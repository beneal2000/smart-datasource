/**
 * 亲子伴读 App - 主入口
 *
 * 根据用户角色（家长/儿童）展示不同界面：
 * - 家长端：录音引导、内容管理、设置
 * - 儿童端：大字体卡通风格播放界面
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
