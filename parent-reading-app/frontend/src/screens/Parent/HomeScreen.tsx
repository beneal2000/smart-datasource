/**
 * 家长首页
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen({ navigation }: any) {
  const { user, switchMode } = useAuthStore();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 欢迎区域 */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>
            你好，{user?.nickname || '家长'} 👋
          </Text>
          <Text style={styles.welcomeSub}>用声音温暖每一个夜晚</Text>
        </View>

        {/* 快捷操作 */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FFF0F0' }]}
            onPress={() => navigation.navigate('Recording')}
          >
            <Text style={styles.actionEmoji}>🎙️</Text>
            <Text style={styles.actionTitle}>录制声音</Text>
            <Text style={styles.actionDesc}>3分钟克隆您的声音</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#F0F5FF' }]}
            onPress={() => switchMode('child')}
          >
            <Text style={styles.actionEmoji}>👶</Text>
            <Text style={styles.actionTitle}>儿童模式</Text>
            <Text style={styles.actionDesc}>切换到儿童播放界面</Text>
          </TouchableOpacity>
        </View>

        {/* 今日数据 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 今日伴读</Text>
          <View style={styles.statsRow}>
            <StatItem label="播放次数" value="3" />
            <StatItem label="总时长" value="12分钟" />
            <StatItem label="已完成" value="2" />
          </View>
        </View>

        {/* 推荐内容 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 推荐内容</Text>
          <TouchableOpacity style={styles.recCard}>
            <Text style={styles.recEmoji}>🌙</Text>
            <View style={styles.recInfo}>
              <Text style={styles.recTitle}>静夜思</Text>
              <Text style={styles.recAuthor}>李白 · 唐</Text>
            </View>
            <Text style={styles.recPlay}>播放 ▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.recCard}>
            <Text style={styles.recEmoji}>🐸</Text>
            <View style={styles.recInfo}>
              <Text style={styles.recTitle}>小蝌蚪找妈妈</Text>
              <Text style={styles.recAuthor}>经典故事 · 3-5岁</Text>
            </View>
            <Text style={styles.recPlay}>播放 ▶</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16 },
  welcome: { marginBottom: 20, padding: 8 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  welcomeSub: { fontSize: 14, color: '#888', marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  actionDesc: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' },
  statsCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 1 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FF6B6B' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  recCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
  recEmoji: { fontSize: 28, marginRight: 12 },
  recInfo: { flex: 1 },
  recTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  recAuthor: { fontSize: 12, color: '#999', marginTop: 2 },
  recPlay: { fontSize: 13, color: '#FF6B6B', fontWeight: 'bold' },
});
