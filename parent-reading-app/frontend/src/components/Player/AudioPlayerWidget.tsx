/**
 * 音频播放器组件
 *
 * 可复用的播放器 UI，支持：
 * - 播放/暂停大按钮
 * - 进度条（可拖动）
 * - 语速切换 (0.8x / 1.0x / 1.2x / 1.5x)
 * - 睡眠定时 (15/30/45/60分钟)
 * - 当前时间/总时长显示
 */
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAudioPlayer, PlayerState } from '../../hooks/useAudioPlayer';

interface AudioPlayerWidgetProps {
  audioUrl: string | null;
  title?: string;
  subtitle?: string;
  voiceLabel?: string;
  onPlayComplete?: () => void;
  compact?: boolean;
}

const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5];
const SLEEP_OPTIONS = [null, 15, 30, 45, 60];

export default function AudioPlayerWidget({
  audioUrl,
  title,
  subtitle,
  voiceLabel = '妈妈的声音',
  onPlayComplete,
  compact = false,
}: AudioPlayerWidgetProps) {
  const player = useAudioPlayer({
    onPlaybackComplete: onPlayComplete,
  });

  // 格式化时间
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 切换播放/暂停
  const togglePlay = useCallback(async () => {
    if (!audioUrl) return;

    if (player.state === 'playing') {
      await player.pause();
    } else if (player.state === 'paused') {
      await player.resume();
    } else {
      await player.play(audioUrl);
    }
  }, [audioUrl, player]);

  // 切换语速
  const cycleSpeed = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.indexOf(player.speed);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    player.setSpeed(SPEED_OPTIONS[nextIdx]);
  }, [player]);

  // 切换睡眠定时
  const cycleSleepTimer = useCallback(() => {
    const currentIdx = SLEEP_OPTIONS.indexOf(player.sleepTimer);
    const nextIdx = (currentIdx + 1) % SLEEP_OPTIONS.length;
    player.setSleepTimer(SLEEP_OPTIONS[nextIdx]);
  }, [player]);

  // 播放按钮图标
  const playButtonContent = useMemo(() => {
    switch (player.state) {
      case 'loading':
        return <ActivityIndicator size="large" color="#FFFFFF" />;
      case 'playing':
        return <Text style={styles.playIcon}>⏸️</Text>;
      case 'error':
        return <Text style={styles.playIcon}>⚠️</Text>;
      default:
        return <Text style={styles.playIcon}>▶️</Text>;
    }
  }, [player.state]);

  // 睡眠定时显示文字
  const sleepLabel = useMemo(() => {
    if (player.sleepTimeRemaining !== null) {
      return `${Math.ceil(player.sleepTimeRemaining / 60)}分`;
    }
    return '定时';
  }, [player.sleepTimeRemaining]);

  if (compact) {
    // 紧凑模式（用于列表内嵌）
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity style={styles.compactPlayBtn} onPress={togglePlay}>
          <Text style={styles.compactPlayIcon}>
            {player.state === 'playing' ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
        <View style={styles.compactProgress}>
          <View
            style={[styles.compactProgressFill, { width: `${player.progress * 100}%` }]}
          />
        </View>
        <Text style={styles.compactTime}>{formatTime(player.currentTime)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 标题 */}
      {title && (
        <View style={styles.titleArea}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${player.progress * 100}%` }]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(player.currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(player.duration)}</Text>
        </View>
      </View>

      {/* 控制区 */}
      <View style={styles.controls}>
        {/* 语速 */}
        <TouchableOpacity style={styles.controlButton} onPress={cycleSpeed}>
          <Text style={styles.controlIcon}>🐢</Text>
          <Text style={styles.controlLabel}>{player.speed}x</Text>
        </TouchableOpacity>

        {/* 播放/暂停 */}
        <TouchableOpacity
          style={[styles.playButton, !audioUrl && styles.playButtonDisabled]}
          onPress={togglePlay}
          disabled={!audioUrl}
        >
          {playButtonContent}
        </TouchableOpacity>

        {/* 睡眠定时 */}
        <TouchableOpacity style={styles.controlButton} onPress={cycleSleepTimer}>
          <Text style={styles.controlIcon}>🌙</Text>
          <Text
            style={[
              styles.controlLabel,
              player.sleepTimer && styles.controlLabelActive,
            ]}
          >
            {sleepLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 声音来源 */}
      {voiceLabel && (
        <View style={styles.voiceInfo}>
          <Text style={styles.voiceLabel}>🎙️ {voiceLabel}</Text>
        </View>
      )}

      {/* 错误提示 */}
      {player.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {player.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0E6D3',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C42',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
  },
  controlLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  controlLabelActive: {
    color: '#FF8C42',
    fontWeight: 'bold',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
  },
  playIcon: {
    fontSize: 32,
  },
  voiceInfo: {
    marginTop: 20,
    backgroundColor: '#FFF0DB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  voiceLabel: {
    fontSize: 13,
    color: '#CC7722',
    fontWeight: '500',
  },
  errorBanner: {
    marginTop: 12,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#CC3333',
  },
  // 紧凑模式样式
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  compactPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPlayIcon: {
    fontSize: 14,
    color: '#FFF',
  },
  compactProgress: {
    flex: 1,
    height: 4,
    backgroundColor: '#EEE',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: '#FF8C42',
  },
  compactTime: {
    fontSize: 11,
    color: '#999',
    width: 36,
    textAlign: 'right',
  },
});
