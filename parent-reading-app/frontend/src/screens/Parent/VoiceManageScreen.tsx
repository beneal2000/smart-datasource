/**
 * 双亲声音管理页面
 *
 * 功能：
 * - 查看家庭所有声音档案（按角色分组）
 * - 设置默认声音
 * - 添加新声音（跳转录音页）
 * - 删除声音
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { voiceAPI } from '../../services/api';

// 角色配置
const VOICE_ROLES = [
  { id: 'mother', label: '妈妈', emoji: '👩', color: '#FFE4E4' },
  { id: 'father', label: '爸爸', emoji: '👨', color: '#E4F0FF' },
  { id: 'grandma', label: '奶奶', emoji: '👵', color: '#FFF4E4' },
  { id: 'grandpa', label: '爷爷', emoji: '👴', color: '#E4FFE4' },
];

interface VoiceProfile {
  voice_id: string;
  voice_name: string;
  voice_role: string;
  status: string;
  is_default: boolean;
  created_at: string;
}

export default function VoiceManageScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [defaultVoiceId, setDefaultVoiceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 加载声音列表
  const loadVoices = useCallback(async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const response: any = await voiceAPI.getVoiceProfiles(user.userId);
      setVoices(response.data || []);
      const defaultV = (response.data || []).find((v: VoiceProfile) => v.is_default);
      setDefaultVoiceId(defaultV?.voice_id || null);
    } catch (error) {
      console.error('加载声音列表失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // 设为默认
  const handleSetDefault = async (voiceId: string) => {
    if (!user) return;
    try {
      await voiceAPI.setDefault(user.userId, voiceId);
      setDefaultVoiceId(voiceId);
      Alert.alert('成功', '已设为默认声音');
    } catch {
      Alert.alert('失败', '设置默认声音失败');
    }
  };

  // 删除声音
  const handleDelete = (voiceId: string, voiceName: string) => {
    Alert.alert(
      '确认删除',
      `确定要删除"${voiceName}"吗？\n删除后无法恢复，需要重新录音。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await voiceAPI.deleteVoice(user.userId, voiceId);
              setVoices((prev) => prev.filter((v) => v.voice_id !== voiceId));
            } catch {
              Alert.alert('失败', '删除失败');
            }
          },
        },
      ]
    );
  };

  // 按角色分组
  const groupedVoices = VOICE_ROLES.map((role) => ({
    ...role,
    voices: voices.filter((v) => v.voice_role === role.id),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadVoices} />
        }
      >
        {/* 说明 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎙️ 家庭声音管理</Text>
          <Text style={styles.headerDesc}>
            为孩子录制不同家庭成员的声音，播放时可自由切换
          </Text>
        </View>

        {/* 按角色分组展示 */}
        {groupedVoices.map((group) => (
          <View key={group.id} style={styles.roleSection}>
            {/* 角色标题 */}
            <View style={[styles.roleHeader, { backgroundColor: group.color }]}>
              <Text style={styles.roleEmoji}>{group.emoji}</Text>
              <Text style={styles.roleLabel}>{group.label}的声音</Text>
              <Text style={styles.roleCount}>{group.voices.length}个</Text>
            </View>

            {/* 声音列表 */}
            {group.voices.length > 0 ? (
              group.voices.map((voice) => (
                <View key={voice.voice_id} style={styles.voiceCard}>
                  <View style={styles.voiceInfo}>
                    <View style={styles.voiceNameRow}>
                      <Text style={styles.voiceName}>{voice.voice_name}</Text>
                      {voice.voice_id === defaultVoiceId && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>默认</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.voiceStatus}>
                      {voice.status === 'ready' ? '✅ 已就绪' :
                       voice.status === 'processing' ? '⏳ 处理中...' : '❌ 失败'}
                    </Text>
                  </View>

                  {/* 操作按钮 */}
                  <View style={styles.voiceActions}>
                    {voice.status === 'ready' && voice.voice_id !== defaultVoiceId && (
                      <TouchableOpacity
                        style={styles.setDefaultBtn}
                        onPress={() => handleSetDefault(voice.voice_id)}
                      >
                        <Text style={styles.setDefaultText}>设为默认</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(voice.voice_id, voice.voice_name)}
                    >
                      <Text style={styles.deleteText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyRole}>
                <Text style={styles.emptyText}>
                  还没有{group.label}的声音
                </Text>
              </View>
            )}

            {/* 添加按钮 */}
            <TouchableOpacity
              style={styles.addVoiceBtn}
              onPress={() => navigation.navigate('Recording', { role: group.id, roleLabel: group.label })}
            >
              <Text style={styles.addVoiceText}>
                + 录制{group.label}的声音
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* 提示 */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 录音小贴士</Text>
          <Text style={styles.tipsText}>• 每位家庭成员录制3-5分钟即可</Text>
          <Text style={styles.tipsText}>• 安静环境 + 正常语速效果最佳</Text>
          <Text style={styles.tipsText}>• 可为每位家长分配不同内容</Text>
          <Text style={styles.tipsText}>• 设为默认的声音会在孩子打开时自动使用</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerDesc: { fontSize: 14, color: '#888', marginTop: 6, textAlign: 'center' },
  roleSection: { marginBottom: 20 },
  roleHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  roleEmoji: { fontSize: 24, marginRight: 8 },
  roleLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  roleCount: { fontSize: 13, color: '#888' },
  voiceCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  voiceInfo: { flex: 1 },
  voiceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceName: { fontSize: 15, fontWeight: '500', color: '#333' },
  defaultBadge: { backgroundColor: '#FF6B6B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  defaultBadgeText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },
  voiceStatus: { fontSize: 12, color: '#888', marginTop: 4 },
  voiceActions: { flexDirection: 'row', gap: 8 },
  setDefaultBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F0F5FF' },
  setDefaultText: { fontSize: 12, color: '#4A90D9' },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteText: { fontSize: 12, color: '#CC4444' },
  emptyRole: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#BBB' },
  addVoiceBtn: { padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD', borderStyle: 'dashed', alignItems: 'center' },
  addVoiceText: { fontSize: 14, color: '#888' },
  tips: { backgroundColor: '#FFF8E7', padding: 16, borderRadius: 12, marginTop: 12 },
  tipsTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  tipsText: { fontSize: 13, color: '#666', lineHeight: 22 },
});
