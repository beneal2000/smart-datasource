/**
 * 个人中心页面
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout, switchMode } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 用户信息 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{user?.nickname || '未设置昵称'}</Text>
            <Text style={styles.phone}>{user?.phone || ''}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {user?.subscriptionType === 'premium' ? '会员' : '免费版'}
            </Text>
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuGroup}>
          <MenuItem icon="🎙️" title="我的声音" subtitle="管理克隆的声音档案" />
          <MenuItem icon="📊" title="伴读统计" subtitle="查看孩子的伴读数据" />
          <MenuItem icon="👶" title="切换儿童模式" subtitle="进入儿童播放界面" onPress={() => switchMode('child')} />
          <MenuItem icon="⭐" title="升级会员" subtitle="解锁更多内容和功能" />
        </View>

        <View style={styles.menuGroup}>
          <MenuItem icon="⚙️" title="设置" subtitle="账号、通知、隐私" />
          <MenuItem icon="❓" title="帮助与反馈" subtitle="常见问题、联系客服" />
          <MenuItem icon="📋" title="关于我们" subtitle="版本 v0.1.0" />
        </View>

        {/* 退出 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, title, subtitle, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28 },
  userInfo: { flex: 1, marginLeft: 16 },
  nickname: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  phone: { fontSize: 13, color: '#999', marginTop: 2 },
  badge: { backgroundColor: '#FFF0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, color: '#FF6B6B', fontWeight: 'bold' },
  menuGroup: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, color: '#333' },
  menuSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  menuArrow: { fontSize: 20, color: '#CCC' },
  logoutButton: { alignItems: 'center', paddingVertical: 14, marginTop: 20 },
  logoutText: { fontSize: 15, color: '#FF4444' },
});
