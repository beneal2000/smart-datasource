/**
 * 声音选择器组件
 *
 * 在播放界面中供儿童/家长选择使用哪个家庭成员的声音。
 * 设计：圆形头像 + 角色名称，可水平滚动，选中态高亮。
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { voiceAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface VoiceProfile {
  voice_id: string;
  voice_name: string;
  voice_role: string;
  status: string;
  is_default: boolean;
}

interface VoiceSelectorProps {
  onVoiceSelect: (voiceId: string, voiceRole: string) => void;
  selectedVoiceId?: string | null;
  compact?: boolean;
}

const ROLE_META: Record<string, { emoji: string; label: string; color: string }> = {
  mother: { emoji: '👩', label: '妈妈', color: '#FFE4E4' },
  father: { emoji: '👨', label: '爸爸', color: '#E4F0FF' },
  grandma: { emoji: '👵', label: '奶奶', color: '#FFF4E4' },
  grandpa: { emoji: '👴', label: '爷爷', color: '#E4FFE4' },
};

export default function VoiceSelector({
  onVoiceSelect,
  selectedVoiceId,
  compact = false,
}: VoiceSelectorProps) {
  const { user } = useAuthStore();
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(selectedVoiceId || null);

  // 加载声音列表
  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response: any = await voiceAPI.getVoiceProfiles(user.userId);
      const readyVoices = (response.data || []).filter(
        (v: VoiceProfile) => v.status === 'ready'
      );
      setVoices(readyVoices);

      // 自动选择默认声音
      if (!activeId) {
        const defaultV = readyVoices.find((v: VoiceProfile) => v.is_default);
        if (defaultV) {
          setActiveId(defaultV.voice_id);
          onVoiceSelect(defaultV.voice_id, defaultV.voice_role);
        } else if (readyVoices.length > 0) {
          setActiveId(readyVoices[0].voice_id);
          onVoiceSelect(readyVoices[0].voice_id, readyVoices[0].voice_role);
        }
      }
    } catch (error) {
      console.error('加载声音失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback(
    (voice: VoiceProfile) => {
      setActiveId(voice.voice_id);
      onVoiceSelect(voice.voice_id, voice.voice_role);
    },
    [onVoiceSelect]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF8C42" />
      </View>
    );
  }

  if (voices.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>还没有录制声音</Text>
        <Text style={styles.emptyHint}>去"录音"页面录制一个吧</Text>
      </View>
    );
  }

  if (compact) {
    // 紧凑模式：仅显示当前选中的声音 + 切换按钮
    const activeVoice = voices.find((v) => v.voice_id === activeId);
    const meta = ROLE_META[activeVoice?.voice_role || 'mother'];

    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => {
          // 循环切换
          const currentIdx = voices.findIndex((v) => v.voice_id === activeId);
          const nextIdx = (currentIdx + 1) % voices.length;
          handleSelect(voices[nextIdx]);
        }}
      >
        <Text style={styles.compactEmoji}>{meta?.emoji || '🎙️'}</Text>
        <Text style={styles.compactLabel}>
          {activeVoice?.voice_name || meta?.label || '声音'}
        </Text>
        {voices.length > 1 && (
          <Text style={styles.compactSwitch}>切换 ›</Text>
        )}
      </TouchableOpacity>
    );
  }

  // 完整模式：水平滚动圆形头像列表
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ 选择声音</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {voices.map((voice) => {
          const meta = ROLE_META[voice.voice_role] || ROLE_META.mother;
          const isActive = voice.voice_id === activeId;

          return (
            <TouchableOpacity
              key={voice.voice_id}
              style={[
                styles.voiceItem,
                isActive && styles.voiceItemActive,
              ]}
              onPress={() => handleSelect(voice)}
            >
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: meta.color },
                  isActive && styles.avatarCircleActive,
                ]}
              >
                <Text style={styles.avatarEmoji}>{meta.emoji}</Text>
              </View>
              <Text
                style={[
                  styles.voiceLabel,
                  isActive && styles.voiceLabelActive,
                ]}
                numberOfLines={1}
              >
                {voice.voice_name || meta.label}
              </Text>
              {voice.is_default && (
                <View style={styles.defaultDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 16,
  },
  voiceItem: {
    alignItems: 'center',
    width: 72,
  },
  voiceItemActive: {},
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCircleActive: {
    borderColor: '#FF8C42',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  voiceLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
  },
  voiceLabelActive: {
    color: '#FF8C42',
    fontWeight: 'bold',
  },
  defaultDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginTop: 4,
  },
  // 紧凑模式
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0DB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  compactEmoji: {
    fontSize: 18,
  },
  compactLabel: {
    fontSize: 13,
    color: '#CC7722',
    fontWeight: '500',
  },
  compactSwitch: {
    fontSize: 12,
    color: '#FF8C42',
    marginLeft: 4,
  },
  // 空状态
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  emptyHint: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
  // 加载
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});
