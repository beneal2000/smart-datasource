/**
 * 登录页面 - 手机号 + 验证码登录
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<any>(null);
  const { login } = useAuthStore();

  // 发送验证码
  const handleSendCode = async () => {
    if (phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    try {
      await authAPI.sendSMS(phone);
      Alert.alert('提示', '验证码已发送（开发环境请查看控制台）');

      // 开始倒计时
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('发送失败', error?.response?.data?.error?.message || '请稍后重试');
    }
  };

  // 登录
  const handleLogin = async () => {
    if (phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      const response: any = await authAPI.login(phone, code);
      const { user, token } = response.data;

      login(
        {
          userId: user.user_id,
          phone: user.phone,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
          subscriptionType: user.subscription_type,
        },
        token
      );

      if (response.data.is_new_user) {
        Alert.alert('欢迎', '注册成功！开始为孩子录制专属声音吧~');
      }
    } catch (error: any) {
      Alert.alert('登录失败', error?.response?.data?.error?.message || '请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>

        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>手机号登录</Text>
          <Text style={styles.subtitle}>未注册手机号验证后自动创建账号</Text>
        </View>

        {/* 表单 */}
        <View style={styles.form}>
          {/* 手机号输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>手机号</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.countryCode}>+86</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="请输入手机号"
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* 验证码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>验证码</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="请输入验证码"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <TouchableOpacity
                style={[styles.codeButton, countdown > 0 && styles.codeButtonDisabled]}
                onPress={handleSendCode}
                disabled={countdown > 0}
              >
                <Text style={styles.codeButtonText}>
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? '登录中...' : '登 录'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, paddingHorizontal: 24 },
  backButton: { paddingVertical: 12 },
  backText: { fontSize: 16, color: '#666666' },
  header: { marginTop: 24, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333333' },
  subtitle: { fontSize: 14, color: '#999999', marginTop: 8 },
  form: {},
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, color: '#666666', marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  countryCode: { fontSize: 16, color: '#333333', paddingRight: 12, borderRightWidth: 1, borderRightColor: '#EEEEEE' },
  phoneInput: { flex: 1, fontSize: 16, paddingVertical: 12, paddingLeft: 12 },
  codeRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  codeInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  codeButton: { backgroundColor: '#FF6B6B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  codeButtonDisabled: { backgroundColor: '#CCCCCC' },
  codeButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  loginButton: { backgroundColor: '#FF6B6B', paddingVertical: 16, borderRadius: 28, alignItems: 'center', marginTop: 32 },
  loginButtonDisabled: { backgroundColor: '#FFAAAA' },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
