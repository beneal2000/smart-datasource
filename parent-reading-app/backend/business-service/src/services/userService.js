/**
 * 用户服务 - 用户信息管理
 */

// 复用 authService 的用户存储（MVP阶段）
const users = new Map();

class UserService {
  /**
   * 获取用户信息
   */
  async getProfile(userId) {
    // MVP: 返回基础信息
    return {
      user_id: userId,
      nickname: `用户${userId.slice(0, 4)}`,
      avatar_url: null,
      phone: '138****0000',
      children_age: null,
      subscription_type: 'free',
      voice_count: 0,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * 更新用户信息
   */
  async updateProfile(userId, updates) {
    const profile = await this.getProfile(userId);
    return { ...profile, ...updates, updated_at: new Date().toISOString() };
  }

  /**
   * 获取订阅状态
   */
  async getSubscription(userId) {
    return {
      type: 'free',
      features: {
        max_poems: 5,
        max_stories: 3,
        max_voices: 1,
        hd_audio: false,
        offline_play: false,
        voice_album_export: false,
      },
      upgrade_url: '/subscription/plans',
    };
  }

  /**
   * 获取用户声音列表
   */
  async getUserVoices(userId) {
    return [];
  }
}

module.exports = new UserService();
