/**
 * 音频离线缓存服务
 *
 * 使用 expo-file-system 将TTS生成的音频下载到本地，
 * 实现无网络环境下的离线播放。
 *
 * 缓存策略：
 * - LRU淘汰：超过最大缓存空间时删除最久未使用的文件
 * - 预下载：收藏内容优先缓存
 * - 到期清理：超过30天未访问的文件自动清理
 *
 * 存储结构：
 * FileSystem.documentDirectory/audio_cache/
 *   ├── {hash}.mp3        # 音频文件
 *   └── manifest.json     # 缓存清单（元数据）
 */
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${FileSystem.documentDirectory}audio_cache/`;
const MANIFEST_KEY = '@audio_cache_manifest';
const MAX_CACHE_SIZE_MB = 500; // 最大缓存 500MB
const MAX_CACHE_AGE_DAYS = 30; // 最长保留 30 天
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

interface CacheEntry {
  key: string;           // 唯一标识 (contentId + voiceId + speed 的 hash)
  localPath: string;     // 本地文件路径
  remoteUrl: string;     // 远程URL
  contentId: string;     // 内容ID
  contentType: string;   // poem | story
  voiceId: string;       // 使用的声音
  title: string;         // 内容标题
  size: number;          // 文件大小 (bytes)
  duration: number;      // 音频时长 (秒)
  createdAt: number;     // 缓存时间戳
  lastAccessedAt: number; // 最后访问时间戳
  downloaded: boolean;   // 是否已下载完成
}

interface CacheManifest {
  entries: Record<string, CacheEntry>;
  totalSize: number;
  lastCleanup: number;
}

class AudioCacheService {
  private manifest: CacheManifest | null = null;
  private initialized = false;

  /**
   * 初始化缓存目录和清单
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 确保缓存目录存在
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }

    // 加载缓存清单
    await this._loadManifest();
    this.initialized = true;

    // 异步清理过期缓存
    this._cleanupExpired();
  }

  /**
   * 获取音频（优先本地缓存，否则返回远程URL）
   */
  async getAudioUrl(params: {
    contentId: string;
    contentType: string;
    voiceId: string;
    speed: number;
    remoteUrl: string;
    title?: string;
    duration?: number;
  }): Promise<{ url: string; isLocal: boolean }> {
    await this.initialize();

    const key = this._generateKey(params.contentId, params.voiceId, params.speed);
    const entry = this.manifest!.entries[key];

    if (entry && entry.downloaded) {
      // 检查本地文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
      if (fileInfo.exists) {
        // 更新最后访问时间
        entry.lastAccessedAt = Date.now();
        await this._saveManifest();
        return { url: entry.localPath, isLocal: true };
      } else {
        // 文件丢失，删除记录
        delete this.manifest!.entries[key];
        this.manifest!.totalSize -= entry.size;
        await this._saveManifest();
      }
    }

    // 返回远程URL
    return { url: params.remoteUrl, isLocal: false };
  }

  /**
   * 下载音频到本地缓存
   */
  async downloadAudio(params: {
    contentId: string;
    contentType: string;
    voiceId: string;
    speed: number;
    remoteUrl: string;
    title: string;
    duration: number;
  }): Promise<string> {
    await this.initialize();

    const key = this._generateKey(params.contentId, params.voiceId, params.speed);

    // 已经缓存过了
    const existing = this.manifest!.entries[key];
    if (existing && existing.downloaded) {
      const fileInfo = await FileSystem.getInfoAsync(existing.localPath);
      if (fileInfo.exists) {
        return existing.localPath;
      }
    }

    // 检查空间
    await this._ensureSpace(10 * 1024 * 1024); // 预留10MB

    // 下载文件
    const ext = params.remoteUrl.includes('.wav') ? 'wav' : 'mp3';
    const localPath = `${CACHE_DIR}${key}.${ext}`;

    const downloadResult = await FileSystem.downloadAsync(
      params.remoteUrl,
      localPath
    );

    if (downloadResult.status !== 200) {
      throw new Error(`下载失败: HTTP ${downloadResult.status}`);
    }

    // 获取文件大小
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    const fileSize = (fileInfo as any).size || 0;

    // 更新清单
    const entry: CacheEntry = {
      key,
      localPath,
      remoteUrl: params.remoteUrl,
      contentId: params.contentId,
      contentType: params.contentType,
      voiceId: params.voiceId,
      title: params.title,
      size: fileSize,
      duration: params.duration,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      downloaded: true,
    };

    this.manifest!.entries[key] = entry;
    this.manifest!.totalSize += fileSize;
    await this._saveManifest();

    return localPath;
  }

  /**
   * 预下载收藏内容
   */
  async predownloadFavorites(items: Array<{
    contentId: string;
    contentType: string;
    voiceId: string;
    remoteUrl: string;
    title: string;
    duration: number;
  }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await this.downloadAudio({ ...item, speed: 1.0 });
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * 检查某内容是否已缓存
   */
  async isCached(contentId: string, voiceId: string, speed: number = 1.0): Promise<boolean> {
    await this.initialize();
    const key = this._generateKey(contentId, voiceId, speed);
    const entry = this.manifest!.entries[key];
    if (!entry || !entry.downloaded) return false;

    const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
    return fileInfo.exists;
  }

  /**
   * 获取缓存统计
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    totalSizeMB: string;
    maxSizeMB: number;
    usagePercent: number;
    oldestEntry: string | null;
  }> {
    await this.initialize();

    const entries = Object.values(this.manifest!.entries);
    const totalFiles = entries.filter(e => e.downloaded).length;
    const totalSize = this.manifest!.totalSize;
    const oldest = entries.length > 0
      ? entries.sort((a, b) => a.createdAt - b.createdAt)[0].title
      : null;

    return {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(1),
      maxSizeMB: MAX_CACHE_SIZE_MB,
      usagePercent: Math.round((totalSize / MAX_CACHE_SIZE_BYTES) * 100),
      oldestEntry: oldest,
    };
  }

  /**
   * 清除所有缓存
   */
  async clearAll(): Promise<void> {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });

    this.manifest = { entries: {}, totalSize: 0, lastCleanup: Date.now() };
    await this._saveManifest();
  }

  /**
   * 删除指定缓存
   */
  async removeEntry(contentId: string, voiceId: string, speed: number = 1.0): Promise<void> {
    await this.initialize();
    const key = this._generateKey(contentId, voiceId, speed);
    const entry = this.manifest!.entries[key];

    if (entry) {
      await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
      this.manifest!.totalSize -= entry.size;
      delete this.manifest!.entries[key];
      await this._saveManifest();
    }
  }

  // ============ 私有方法 ============

  private _generateKey(contentId: string, voiceId: string, speed: number): string {
    const raw = `${contentId}_${voiceId}_${speed}`;
    // 简单hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `audio_${Math.abs(hash).toString(36)}`;
  }

  private async _loadManifest(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(MANIFEST_KEY);
      if (data) {
        this.manifest = JSON.parse(data);
      } else {
        this.manifest = { entries: {}, totalSize: 0, lastCleanup: Date.now() };
      }
    } catch {
      this.manifest = { entries: {}, totalSize: 0, lastCleanup: Date.now() };
    }
  }

  private async _saveManifest(): Promise<void> {
    if (this.manifest) {
      await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(this.manifest));
    }
  }

  private async _ensureSpace(requiredBytes: number): Promise<void> {
    if (!this.manifest) return;

    while (this.manifest.totalSize + requiredBytes > MAX_CACHE_SIZE_BYTES) {
      // LRU淘汰：删除最久未访问的
      const entries = Object.values(this.manifest.entries)
        .filter(e => e.downloaded)
        .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

      if (entries.length === 0) break;

      const oldest = entries[0];
      await FileSystem.deleteAsync(oldest.localPath, { idempotent: true });
      this.manifest.totalSize -= oldest.size;
      delete this.manifest.entries[oldest.key];
    }

    await this._saveManifest();
  }

  private async _cleanupExpired(): Promise<void> {
    if (!this.manifest) return;

    const now = Date.now();
    const maxAge = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;

    // 每天最多清理一次
    if (now - this.manifest.lastCleanup < 24 * 60 * 60 * 1000) return;

    const expiredKeys: string[] = [];
    for (const [key, entry] of Object.entries(this.manifest.entries)) {
      if (now - entry.lastAccessedAt > maxAge) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.manifest.entries[key];
      await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
      this.manifest.totalSize -= entry.size;
      delete this.manifest.entries[key];
    }

    this.manifest.lastCleanup = now;
    await this._saveManifest();

    if (expiredKeys.length > 0) {
      console.log(`🗑️ 清理 ${expiredKeys.length} 个过期缓存`);
    }
  }
}

// 导出单例
export const audioCache = new AudioCacheService();
