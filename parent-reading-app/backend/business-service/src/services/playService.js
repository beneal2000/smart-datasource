/**
 * 播放服务 - 音频生成与播放记录
 */
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// 播放历史存储（MVP内存版）
const playHistory = new Map();

class PlayService {
  /**
   * 生成播放音频
   *
   * 完整流程：
   * 1. 获取内容文本
   * 2. 调用AI服务TTS合成
   * 3. （可选）与背景音乐混音
   * 4. 返回最终音频URL
   */
  async generateAudio({
    userId,
    contentId,
    contentType,
    voiceId,
    speed,
    musicId,
    voiceVolume,
    musicVolume,
  }) {
    // 1. 获取内容文本（调用contentService）
    const contentService = require('./contentService');
    let text = '';

    if (contentType === 'poem') {
      const poem = await contentService.getPoemById(contentId);
      if (!poem) throw new Error('古诗不存在');
      text = `${poem.title}。${poem.author}。${poem.content}`;
    } else {
      const story = await contentService.getStoryById(contentId);
      if (!story) throw new Error('故事不存在');
      text = story.content;
    }

    // 2. 调用AI服务TTS合成（通过HTTP）
    // 生产环境通过 httpx 调用 AI Service
    const ttsResult = {
      audio_url: `/storage/tts/${uuidv4()}.wav`,
      duration: text.length * 0.3, // 估算时长
    };

    // 3. 混音（如果指定了背景音乐）
    let finalAudioUrl = ttsResult.audio_url;
    let finalDuration = ttsResult.duration;

    if (musicId) {
      // 调用AI服务混音接口
      finalAudioUrl = `/storage/mixed/${uuidv4()}.mp3`;
    }

    return {
      audio_url: finalAudioUrl,
      duration: finalDuration,
      content_id: contentId,
      content_type: contentType,
      voice_id: voiceId,
      speed,
      music_id: musicId || null,
    };
  }

  /**
   * 记录播放行为
   */
  async recordPlay({ userId, contentId, contentType, duration, completed }) {
    const record = {
      id: uuidv4(),
      userId,
      contentId,
      contentType,
      duration,
      completed,
      playedAt: new Date().toISOString(),
    };

    if (!playHistory.has(userId)) {
      playHistory.set(userId, []);
    }
    playHistory.get(userId).unshift(record);

    // 限制历史记录数量
    const history = playHistory.get(userId);
    if (history.length > 500) {
      playHistory.set(userId, history.slice(0, 500));
    }

    return record;
  }

  /**
   * 获取播放历史
   */
  async getHistory(userId, page = 1, pageSize = 20) {
    const history = playHistory.get(userId) || [];
    const total = history.length;
    const start = (page - 1) * pageSize;
    const items = history.slice(start, start + pageSize);

    return { total, page, page_size: pageSize, items };
  }

  /**
   * 获取播放统计
   */
  async getStats(userId) {
    const history = playHistory.get(userId) || [];
    const today = new Date().toISOString().split('T')[0];

    const todayRecords = history.filter((r) => r.playedAt.startsWith(today));
    const totalDuration = history.reduce((sum, r) => sum + r.duration, 0);
    const todayDuration = todayRecords.reduce((sum, r) => sum + r.duration, 0);

    return {
      today: {
        play_count: todayRecords.length,
        total_duration: todayDuration,
        completed_count: todayRecords.filter((r) => r.completed).length,
      },
      total: {
        play_count: history.length,
        total_duration: totalDuration,
        completed_count: history.filter((r) => r.completed).length,
      },
    };
  }
}

module.exports = new PlayService();
