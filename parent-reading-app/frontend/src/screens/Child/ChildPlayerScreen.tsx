/**
 * 儿童播放页面
 *
 * 设计理念：
 * - 大字体、大按钮，儿童友好
 * - 卡通风格配色
 * - 一键播放，操作极简
 * - 支持定时关闭（睡眠模式）
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 播放状态
type PlayerState = 'idle' | 'loading' | 'playing' | 'paused';

export default function ChildPlayerScreen() {
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentContent, setCurrentContent] = useState({
    title: '静夜思',
    author: '李白',
    content: '床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。',
    type: 'poem',
  });
  const [progress, setProgress] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1.0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // 旋转动画（播放时CD旋转效果）
  useEffect(() => {
    if (playerState === 'playing') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [playerState]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 播放/暂停
  const togglePlay = async () => {
    if (playerState === 'idle' || playerState === 'paused') {
      setPlayerState('playing');
      // 实际实现中调用 playAPI.generateAudio 获取音频URL
      // 然后用 Audio.Sound 播放
      startBounceAnimation();
    } else if (playerState === 'playing') {
      setPlayerState('paused');
      bounceAnim.stopAnimation();
    }
  };

  // 弹跳动画
  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 400, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  };

  // 速度切换
  const toggleSpeed = () => {
    const speeds = [0.8, 1.0, 1.2];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setSpeed(speeds[nextIndex]);
  };

  // 睡眠定时
  const toggleSleepTimer = () => {
    const timers = [null, 15, 30, 45, 60];
    const currentIndex = timers.indexOf(sleepTimer);
    const nextIndex = (currentIndex + 1) % timers.length;
    setSleepTimer(timers[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.playerArea}>
        {/* 内容展示区 */}
        <Animated.View style={[styles.contentCard, { transform: [{ translateY: bounceAnim }] }]}>
          {/* 旋转唱片 */}
          <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
            <Text style={styles.discEmoji}>
              {currentContent.type === 'poem' ? '📜' : '📖'}
            </Text>
          </Animated.View>

          <Text style={styles.contentTitle}>{currentContent.title}</Text>
          <Text style={styles.contentAuthor}>{currentContent.author}</Text>

          {/* 诗词/故事内容 - 大字体 */}
          <View style={styles.textArea}>
            <Text style={styles.contentText}>{currentContent.content}</Text>
          </View>
        </Animated.View>

        {/* 进度条 */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* 播放控制 */}
        <View style={styles.controls}>
          {/* 速度 */}
          <TouchableOpacity style={styles.controlButton} onPress={toggleSpeed}>
            <Text style={styles.controlIcon}>🐢</Text>
            <Text style={styles.controlLabel}>{speed}x</Text>
          </TouchableOpacity>

          {/* 播放/暂停（大按钮） */}
          <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
            <Text style={styles.playIcon}>
              {playerState === 'playing' ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>

          {/* 睡眠定时 */}
          <TouchableOpacity style={styles.controlButton} onPress={toggleSleepTimer}>
            <Text style={styles.controlIcon}>🌙</Text>
            <Text style={styles.controlLabel}>
              {sleepTimer ? `${sleepTimer}分` : '定时'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 声音来源 */}
        <View style={styles.voiceInfo}>
          <Text style={styles.voiceLabel}>🎙️ 妈妈的声音</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  playerArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  disc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  discEmoji: {
    fontSize: 36,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  contentAuthor: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: '#FFFDF7',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  contentText: {
    fontSize: 22,
    lineHeight: 38,
    color: '#444444',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0E6D3',
    borderRadius: 3,
    marginTop: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C42',
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
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
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playIcon: {
    fontSize: 36,
  },
  voiceInfo: {
    marginTop: 24,
    backgroundColor: '#FFF0DB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  voiceLabel: {
    fontSize: 14,
    color: '#CC7722',
    fontWeight: '500',
  },
});
