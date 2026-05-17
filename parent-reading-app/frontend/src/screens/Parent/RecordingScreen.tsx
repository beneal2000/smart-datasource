/**
 * 家长录音页面
 *
 * 核心功能：
 * - 录音引导（图文指引，降低录音门槛）
 * - 实时录音进度显示
 * - 录音质量检测
 * - 上传并启动声音克隆
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useAuthStore } from '../../store/authStore';
import { voiceAPI } from '../../services/api';

// 录音状态枚举
type RecordingState = 'idle' | 'recording' | 'paused' | 'completed' | 'uploading';

export default function RecordingScreen() {
  const { user } = useAuthStore();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [voiceName, setVoiceName] = useState('');
  const [cloneTaskId, setCloneTaskId] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 最小录音时长 3分钟
  const MIN_DURATION = 180;
  const MAX_DURATION = 600;

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('权限提示', '请允许麦克风权限以录制声音');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordingState('recording');
      setDuration(0);

      // 开始计时
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // 脉冲动画
      startPulseAnimation();
    } catch (error) {
      Alert.alert('录音失败', '无法启动录音，请检查设备权限');
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    clearInterval(timerRef.current);
    pulseAnim.stopAnimation();

    await recordingRef.current.stopAndUnloadAsync();
    setRecordingState('completed');
  }, []);

  // 上传录音
  const uploadRecording = useCallback(async () => {
    if (!recordingRef.current || !user) return;

    if (duration < MIN_DURATION) {
      Alert.alert('录音不足', `至少需要录制3分钟（当前${formatTime(duration)}）`);
      return;
    }

    setRecordingState('uploading');

    try {
      const uri = recordingRef.current.getURI();
      const formData = new FormData();
      formData.append('audio_file', {
        uri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any);
      formData.append('user_id', user.userId);
      formData.append('voice_name', voiceName || '我的声音');
      formData.append('voice_role', 'mother');

      const response: any = await voiceAPI.uploadRecording(formData);
      setCloneTaskId(response.data.task_id);

      Alert.alert(
        '上传成功',
        '声音克隆任务已创建，预计2分钟后完成。完成后可在"我的声音"中查看。',
        [{ text: '好的', onPress: () => resetRecording() }]
      );
    } catch (error: any) {
      Alert.alert('上传失败', error?.response?.data?.error?.message || '请重试');
      setRecordingState('completed');
    }
  }, [duration, user, voiceName]);

  // 重置录音
  const resetRecording = () => {
    recordingRef.current = null;
    setRecordingState('idle');
    setDuration(0);
    setCloneTaskId(null);
  };

  // 脉冲动画
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 录音引导 */}
        {recordingState === 'idle' && (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>为孩子录制专属声音</Text>
            <Text style={styles.guideSubtitle}>
              只需3-5分钟，即可克隆您的声音为孩子朗读诗词故事
            </Text>

            <View style={styles.tips}>
              <TipItem icon="🔇" text="找一个安静的环境" />
              <TipItem icon="📱" text="手机距嘴巴20-30厘米" />
              <TipItem icon="🗣️" text="用正常语速朗读下方文本" />
              <TipItem icon="⏱️" text="建议录制3-5分钟" />
            </View>

            {/* 朗读参考文本 */}
            <View style={styles.referenceText}>
              <Text style={styles.referenceTitle}>📋 参考朗读文本</Text>
              <Text style={styles.referenceContent}>
                从前有一座大森林，森林里住着许多小动物。有一天早上，太阳暖暖地照着大地，小鸟在树上欢快地歌唱。小兔子蹦蹦跳跳地出了门，她要去采蘑菇。一路上，她遇见了小松鼠、小刺猬和小鹿。他们一起在草地上玩耍，度过了快乐的一天。晚上回家的时候，月亮已经升起来了，星星在天上眨着眼睛。妈妈在门口等着她，轻轻地说：宝贝，该睡觉了。
              </Text>
            </View>
          </View>
        )}

        {/* 录音中 / 完成状态 */}
        <View style={styles.recordingSection}>
          {/* 录音按钮 */}
          <View style={styles.buttonArea}>
            {recordingState === 'recording' && (
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
            )}

            <TouchableOpacity
              style={[
                styles.recordButton,
                recordingState === 'recording' && styles.recordButtonActive,
              ]}
              onPress={recordingState === 'idle' ? startRecording : stopRecording}
              disabled={recordingState === 'uploading'}
            >
              <Text style={styles.recordButtonIcon}>
                {recordingState === 'idle'
                  ? '🎙️'
                  : recordingState === 'recording'
                  ? '⏹️'
                  : recordingState === 'uploading'
                  ? '⏳'
                  : '✅'}
              </Text>
            </TouchableOpacity>

            {/* 时长显示 */}
            <Text style={styles.durationText}>{formatTime(duration)}</Text>
            {recordingState === 'recording' && (
              <Text style={styles.minHint}>
                {duration < MIN_DURATION
                  ? `还需录制 ${formatTime(MIN_DURATION - duration)}`
                  : '✓ 时长已足够，可以停止'}
              </Text>
            )}
          </View>

          {/* 操作按钮 */}
          {recordingState === 'completed' && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.retryButton} onPress={resetRecording}>
                <Text style={styles.retryText}>重新录制</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={uploadRecording}>
                <Text style={styles.uploadText}>上传克隆</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TipItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.tipItem}>
      <Text style={styles.tipIcon}>{icon}</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20 },
  guideSection: { marginBottom: 32 },
  guideTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  guideSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  tips: { marginTop: 24, backgroundColor: '#FFF5F5', padding: 16, borderRadius: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipIcon: { fontSize: 20, marginRight: 12 },
  tipText: { fontSize: 15, color: '#444' },
  referenceText: { marginTop: 20, backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12 },
  referenceTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  referenceContent: { fontSize: 14, color: '#555', lineHeight: 24 },
  recordingSection: { alignItems: 'center', paddingVertical: 40 },
  buttonArea: { alignItems: 'center' },
  pulseCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255, 107, 107, 0.2)' },
  recordButton: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  recordButtonActive: { backgroundColor: '#FF4444' },
  recordButtonIcon: { fontSize: 40 },
  durationText: { fontSize: 32, fontWeight: 'bold', color: '#333', marginTop: 20 },
  minHint: { fontSize: 13, color: '#999', marginTop: 8 },
  actions: { flexDirection: 'row', marginTop: 32, gap: 16 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: '#DDD' },
  retryText: { fontSize: 15, color: '#666' },
  uploadButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, backgroundColor: '#FF6B6B' },
  uploadText: { fontSize: 15, color: '#FFF', fontWeight: 'bold' },
});
