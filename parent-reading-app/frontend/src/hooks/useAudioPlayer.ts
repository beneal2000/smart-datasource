/**
 * 音频播放 Hook - expo-av 集成
 *
 * 提供完整的音频播放能力：
 * - 播放/暂停/停止
 * - 进度追踪
 * - 语速调节 (0.5x - 2.0x)
 * - 睡眠定时
 * - 播放完成回调
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

interface AudioPlayerOptions {
  onPlaybackComplete?: () => void;
  onError?: (error: string) => void;
  autoPlay?: boolean;
}

interface AudioPlayerReturn {
  // State
  state: PlayerState;
  progress: number; // 0-1
  currentTime: number; // seconds
  duration: number; // seconds
  speed: number;
  error: string | null;

  // Actions
  play: (uri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setSpeed: (rate: number) => void;
  setSleepTimer: (minutes: number | null) => void;

  // Sleep timer
  sleepTimer: number | null;
  sleepTimeRemaining: number | null;
}

export function useAudioPlayer(options: AudioPlayerOptions = {}): AudioPlayerReturn {
  const { onPlaybackComplete, onError, autoPlay = false } = options;

  const [state, setState] = useState<PlayerState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [sleepTimer, setSleepTimerState] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 配置音频模式
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      // 组件卸载时清理
      cleanup();
    };
  }, []);

  // 清理资源
  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, []);

  // 播放状态更新回调
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if (status.error) {
          setError(status.error);
          setState('error');
          onError?.(status.error);
        }
        return;
      }

      // 更新进度
      if (status.durationMillis && status.durationMillis > 0) {
        const dur = status.durationMillis / 1000;
        const cur = status.positionMillis / 1000;
        setDuration(dur);
        setCurrentTime(cur);
        setProgress(cur / dur);
      }

      // 播放完成
      if (status.didJustFinish) {
        setState('stopped');
        setProgress(1);
        onPlaybackComplete?.();
      }

      // 更新播放状态
      if (status.isPlaying) {
        setState('playing');
      } else if (status.isBuffering) {
        setState('loading');
      }
    },
    [onPlaybackComplete, onError]
  );

  // 播放
  const play = useCallback(
    async (uri: string) => {
      try {
        // 清理旧的播放
        await cleanup();
        setError(null);
        setState('loading');
        setProgress(0);
        setCurrentTime(0);

        // 处理URI：如果是相对路径，加上服务器基址
        let audioUri = uri;
        if (uri.startsWith('/storage/')) {
          // 通过业务服务获取（开发环境）
          audioUri = `http://localhost:3000${uri}`;
        }

        // 创建并加载音频
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          {
            shouldPlay: true,
            rate: speed,
            shouldCorrectPitch: true,
            progressUpdateIntervalMillis: 500,
          },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
        setState('playing');
      } catch (err: any) {
        const errMsg = err?.message || '播放失败';
        setError(errMsg);
        setState('error');
        onError?.(errMsg);
      }
    },
    [speed, cleanup, onPlaybackStatusUpdate, onError]
  );

  // 暂停
  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setState('paused');
    }
  }, []);

  // 继续播放
  const resume = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setState('playing');
    }
  }, []);

  // 停止
  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setState('stopped');
      setProgress(0);
      setCurrentTime(0);
    }
  }, []);

  // 跳转
  const seekTo = useCallback(async (position: number) => {
    if (soundRef.current && duration > 0) {
      const millis = position * duration * 1000;
      await soundRef.current.setPositionAsync(millis);
    }
  }, [duration]);

  // 设置语速
  const setSpeed = useCallback(
    (rate: number) => {
      const clampedRate = Math.max(0.5, Math.min(2.0, rate));
      setSpeedState(clampedRate);
      if (soundRef.current) {
        soundRef.current.setRateAsync(clampedRate, true);
      }
    },
    []
  );

  // 设置睡眠定时
  const setSleepTimer = useCallback(
    (minutes: number | null) => {
      // 清除现有定时器
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }

      if (minutes === null) {
        setSleepTimerState(null);
        setSleepTimeRemaining(null);
        return;
      }

      setSleepTimerState(minutes);
      let remaining = minutes * 60; // 转为秒
      setSleepTimeRemaining(remaining);

      sleepTimerRef.current = setInterval(async () => {
        remaining -= 1;
        setSleepTimeRemaining(remaining);

        if (remaining <= 0) {
          // 定时到达，停止播放
          if (soundRef.current) {
            // 渐出效果：先降音量再停止
            try {
              await soundRef.current.setVolumeAsync(0.3);
              setTimeout(async () => {
                await soundRef.current?.setVolumeAsync(0.1);
                setTimeout(async () => {
                  await soundRef.current?.stopAsync();
                  setState('stopped');
                }, 2000);
              }, 2000);
            } catch {
              await soundRef.current?.stopAsync();
              setState('stopped');
            }
          }

          if (sleepTimerRef.current) {
            clearInterval(sleepTimerRef.current);
            sleepTimerRef.current = null;
          }
          setSleepTimerState(null);
          setSleepTimeRemaining(null);
        }
      }, 1000);
    },
    []
  );

  return {
    state,
    progress,
    currentTime,
    duration,
    speed,
    error,
    play,
    pause,
    resume,
    stop,
    seekTo,
    setSpeed,
    setSleepTimer,
    sleepTimer,
    sleepTimeRemaining,
  };
}
