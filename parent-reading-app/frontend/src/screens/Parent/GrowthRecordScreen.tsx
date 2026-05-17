/**
 * 成长记录 / 声音相册
 *
 * 功能：
 * - 伴读时间线（按日/周/月）
 * - 播放统计（总时长、完成数、连续天数）
 * - 声音相册：保存每次伴读的音频片段，孩子长大后可回听
 * - 分享功能：生成精美卡片分享到朋友圈
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

// 时间线记录
interface TimelineRecord {
  id: string;
  date: string;
  type: 'poem' | 'story';
  title: string;
  voiceRole: string;
  duration: number; // 秒
  emotion?: string;
}

// 成就徽章
interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  achieved: boolean;
  progress: number; // 0-100
}

// 模拟数据
const MOCK_TIMELINE: TimelineRecord[] = [
  { id: '1', date: '2026-05-17', type: 'poem', title: '静夜思', voiceRole: 'mother', duration: 45, emotion: 'sad' },
  { id: '2', date: '2026-05-17', type: 'story', title: '小蝌蚪找妈妈', voiceRole: 'father', duration: 180, emotion: 'gentle' },
  { id: '3', date: '2026-05-16', type: 'poem', title: '春晓', voiceRole: 'mother', duration: 38, emotion: 'happy' },
  { id: '4', date: '2026-05-16', type: 'poem', title: '咏鹅', voiceRole: 'mother', duration: 30, emotion: 'playful' },
  { id: '5', date: '2026-05-15', type: 'story', title: '龟兔赛跑', voiceRole: 'father', duration: 150, emotion: 'excited' },
  { id: '6', date: '2026-05-14', type: 'poem', title: '登鹳雀楼', voiceRole: 'mother', duration: 42 },
  { id: '7', date: '2026-05-13', type: 'poem', title: '望庐山瀑布', voiceRole: 'grandma', duration: 55 },
];

const MOCK_BADGES: Badge[] = [
  { id: 'b1', name: '初次伴读', emoji: '🌟', description: '完成第一次伴读', achieved: true, progress: 100 },
  { id: 'b2', name: '诗词小达人', emoji: '📜', description: '听完10首古诗', achieved: true, progress: 100 },
  { id: 'b3', name: '故事探险家', emoji: '🗺️', description: '听完5个故事', achieved: false, progress: 60 },
  { id: 'b4', name: '连续7天', emoji: '🔥', description: '连续7天伴读', achieved: false, progress: 71 },
  { id: 'b5', name: '家庭合唱团', emoji: '👨‍👩‍👧', description: '使用3位以上家人声音', achieved: false, progress: 33 },
  { id: 'b6', name: '百首诗词', emoji: '🏆', description: '累计听完100首古诗', achieved: false, progress: 7 },
];

export default function GrowthRecordScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'badges' | 'album'>('timeline');

  // 统计数据
  const totalDays = 5;
  const totalDuration = MOCK_TIMELINE.reduce((sum, r) => sum + r.duration, 0);
  const totalPoems = MOCK_TIMELINE.filter(r => r.type === 'poem').length;
  const totalStories = MOCK_TIMELINE.filter(r => r.type === 'story').length;
  const consecutiveDays = 5;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}分钟`;
    const hours = Math.floor(mins / 60);
    return `${hours}小时${mins % 60}分`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 统计概览 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 伴读统计</Text>
          <View style={styles.statsGrid}>
            <StatBox value={`${totalDays}`} label="伴读天数" color="#FF6B6B" />
            <StatBox value={formatDuration(totalDuration)} label="总时长" color="#4ECDC4" />
            <StatBox value={`${totalPoems}`} label="古诗" color="#45B7D1" />
            <StatBox value={`${totalStories}`} label="故事" color="#96CEB4" />
          </View>
          {/* 连续天数 */}
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>连续伴读 {consecutiveDays} 天</Text>
          </View>
        </View>

        {/* Tab切换 */}
        <View style={styles.tabs}>
          {[
            { id: 'timeline', label: '📅 时间线' },
            { id: 'badges', label: '🏅 成就' },
            { id: 'album', label: '💿 声音相册' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 时间线 */}
        {activeTab === 'timeline' && (
          <View style={styles.timeline}>
            {MOCK_TIMELINE.map((record, index) => {
              const showDate = index === 0 || record.date !== MOCK_TIMELINE[index - 1].date;
              return (
                <View key={record.id}>
                  {showDate && (
                    <Text style={styles.dateHeader}>
                      {record.date === '2026-05-17' ? '今天' :
                       record.date === '2026-05-16' ? '昨天' : record.date}
                    </Text>
                  )}
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineRow}>
                        <Text style={styles.timelineEmoji}>
                          {record.type === 'poem' ? '📜' : '📖'}
                        </Text>
                        <Text style={styles.timelineTitle}>{record.title}</Text>
                        <Text style={styles.timelineVoice}>
                          {record.voiceRole === 'mother' ? '👩' :
                           record.voiceRole === 'father' ? '👨' : '👵'}
                        </Text>
                      </View>
                      <Text style={styles.timelineMeta}>
                        {formatDuration(record.duration)} · {record.emotion || '温柔'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 成就徽章 */}
        {activeTab === 'badges' && (
          <View style={styles.badgesGrid}>
            {MOCK_BADGES.map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgeCard, !badge.achieved && styles.badgeCardLocked]}
              >
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
                {/* 进度条 */}
                <View style={styles.badgeProgress}>
                  <View style={[styles.badgeProgressFill, { width: `${badge.progress}%` }]} />
                </View>
                <Text style={styles.badgePercent}>{badge.progress}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* 声音相册 */}
        {activeTab === 'album' && (
          <View style={styles.albumSection}>
            <View style={styles.albumHeader}>
              <Text style={styles.albumTitle}>🎙️ 声音时光机</Text>
              <Text style={styles.albumDesc}>
                每一段伴读都是珍贵的记忆。{'\n'}
                孩子长大后，可以回听爸爸妈妈年轻时的声音。
              </Text>
            </View>

            {/* 相册卡片 */}
            <View style={styles.albumCard}>
              <View style={styles.albumCardHeader}>
                <Text style={styles.albumDate}>2026年5月</Text>
                <Text style={styles.albumCount}>7段录音</Text>
              </View>
              <View style={styles.albumItems}>
                {MOCK_TIMELINE.slice(0, 4).map((record) => (
                  <TouchableOpacity key={record.id} style={styles.albumItem}>
                    <Text style={styles.albumItemEmoji}>
                      {record.voiceRole === 'mother' ? '👩' : '👨'}
                    </Text>
                    <Text style={styles.albumItemTitle} numberOfLines={1}>
                      {record.title}
                    </Text>
                    <Text style={styles.albumItemPlay}>▶️</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.albumExport}>
                <Text style={styles.albumExportText}>📤 导出声音相册</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16, paddingBottom: 40 },
  statsCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 2 },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, backgroundColor: '#FFF8E1', padding: 8, borderRadius: 20 },
  streakEmoji: { fontSize: 18, marginRight: 6 },
  streakText: { fontSize: 14, color: '#F57C00', fontWeight: 'bold' },
  tabs: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EEE', alignItems: 'center' },
  tabActive: { backgroundColor: '#FF6B6B' },
  tabText: { fontSize: 13, color: '#666' },
  tabTextActive: { color: '#FFF', fontWeight: 'bold' },
  timeline: { paddingLeft: 8 },
  dateHeader: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 12, marginBottom: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingLeft: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B6B', marginTop: 6, marginRight: 12 },
  timelineContent: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 10, elevation: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'center' },
  timelineEmoji: { fontSize: 16, marginRight: 8 },
  timelineTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333' },
  timelineVoice: { fontSize: 16 },
  timelineMeta: { fontSize: 12, color: '#999', marginTop: 4 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 1 },
  badgeCardLocked: { opacity: 0.6 },
  badgeEmoji: { fontSize: 32, marginBottom: 8 },
  badgeName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  badgeDesc: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  badgeProgress: { height: 4, width: '100%', backgroundColor: '#F0F0F0', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  badgeProgressFill: { height: '100%', backgroundColor: '#FF6B6B', borderRadius: 2 },
  badgePercent: { fontSize: 10, color: '#999', marginTop: 4 },
  albumSection: {},
  albumHeader: { alignItems: 'center', marginBottom: 16 },
  albumTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  albumDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  albumCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 2 },
  albumCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  albumDate: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  albumCount: { fontSize: 13, color: '#888' },
  albumItems: { gap: 8 },
  albumItem: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F8F9FA', borderRadius: 8 },
  albumItemEmoji: { fontSize: 20, marginRight: 10 },
  albumItemTitle: { flex: 1, fontSize: 14, color: '#333' },
  albumItemPlay: { fontSize: 16 },
  albumExport: { marginTop: 14, paddingVertical: 12, borderRadius: 24, backgroundColor: '#FFF0DB', alignItems: 'center' },
  albumExportText: { fontSize: 14, color: '#CC7722', fontWeight: '500' },
});
