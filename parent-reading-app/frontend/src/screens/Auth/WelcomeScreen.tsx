/**
 * 欢迎页面 - App首次打开展示
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo区域 */}
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>📖</Text>
          <Text style={styles.title}>亲子伴读</Text>
          <Text style={styles.subtitle}>用爸爸妈妈的声音，陪伴每一个夜晚</Text>
        </View>

        {/* 特性介绍 */}
        <View style={styles.features}>
          <FeatureItem emoji="🎙️" text="录制声音，3分钟即可克隆" />
          <FeatureItem emoji="📚" text="精选古诗故事，有声伴读" />
          <FeatureItem emoji="🌙" text="睡前模式，温暖入眠" />
        </View>

        {/* 登录按钮 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>手机号登录</Text>
          </TouchableOpacity>

          <Text style={styles.agreement}>
            登录即表示同意《用户协议》和《隐私政策》
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  features: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
  },
  buttonSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  agreement: {
    marginTop: 16,
    fontSize: 12,
    color: '#999999',
  },
});
