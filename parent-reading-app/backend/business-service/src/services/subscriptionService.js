/**
 * 会员订阅服务
 *
 * 功能分级：
 * - free: 免费版（5首古诗 + 3个故事 + 1个声音 + 标准音质）
 * - premium: 付费版 ¥28/月 或 ¥198/年
 *   - 无限内容库
 *   - 双亲声音 + 祖父母声音（最多4个）
 *   - 高清音质
 *   - 离线播放
 *   - 声音相册导出
 *   - 互动绘本
 */
const { v4: uuidv4 } = require('uuid');

// 订阅计划定义
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: '免费版',
    price: 0,
    features: {
      max_poems: 5,
      max_stories: 3,
      max_voices: 1,
      hd_audio: false,
      offline_play: false,
      voice_album_export: false,
      picture_book: false,
      growth_record: true,
      background_music: true,
      sleep_timer: true,
      speed_control: true,
      emotion_styles: false, // 情感韵律（仅付费）
    },
  },
  premium_monthly: {
    id: 'premium_monthly',
    name: '月度会员',
    price: 2800, // 分为单位 = ¥28
    period: 'monthly',
    features: {
      max_poems: -1, // 无限
      max_stories: -1,
      max_voices: 4,
      hd_audio: true,
      offline_play: true,
      voice_album_export: true,
      picture_book: true,
      growth_record: true,
      background_music: true,
      sleep_timer: true,
      speed_control: true,
      emotion_styles: true,
    },
  },
  premium_yearly: {
    id: 'premium_yearly',
    name: '年度会员',
    price: 19800, // ¥198/年（相当于¥16.5/月）
    period: 'yearly',
    original_price: 33600, // 原价 ¥336（28×12）
    discount: '5.9折',
    features: {
      max_poems: -1,
      max_stories: -1,
      max_voices: 4,
      hd_audio: true,
      offline_play: true,
      voice_album_export: true,
      picture_book: true,
      growth_record: true,
      background_music: true,
      sleep_timer: true,
      speed_control: true,
      emotion_styles: true,
    },
  },
};

// 用户订阅存储（MVP内存版）
const subscriptions = new Map();

class SubscriptionService {
  /**
   * 获取所有订阅计划
   */
  async getPlans() {
    return Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period || null,
      original_price: plan.original_price || null,
      discount: plan.discount || null,
      features: plan.features,
    }));
  }

  /**
   * 获取用户当前订阅状态
   */
  async getUserSubscription(userId) {
    const sub = subscriptions.get(userId);

    if (!sub || this._isExpired(sub)) {
      return {
        plan_id: 'free',
        plan_name: '免费版',
        status: 'active',
        features: SUBSCRIPTION_PLANS.free.features,
        expires_at: null,
        can_upgrade: true,
      };
    }

    const plan = SUBSCRIPTION_PLANS[sub.planId] || SUBSCRIPTION_PLANS.free;
    return {
      plan_id: sub.planId,
      plan_name: plan.name,
      status: sub.status,
      features: plan.features,
      starts_at: sub.startsAt,
      expires_at: sub.expiresAt,
      auto_renew: sub.autoRenew,
      can_upgrade: false,
    };
  }

  /**
   * 创建订阅订单
   */
  async createOrder(userId, planId) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error(`无效的订阅计划: ${planId}`);
    }
    if (plan.price === 0) {
      throw new Error('免费计划无需购买');
    }

    const orderId = uuidv4();
    const order = {
      order_id: orderId,
      user_id: userId,
      plan_id: planId,
      plan_name: plan.name,
      amount: plan.price,
      status: 'pending', // pending -> paid -> active
      created_at: new Date().toISOString(),
      // 实际支付信息（后期对接支付宝/微信支付）
      payment_url: null,
    };

    return order;
  }

  /**
   * 确认支付（模拟）
   */
  async confirmPayment(userId, orderId, planId) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error('计划不存在');
    }

    const now = new Date();
    let expiresAt;

    if (plan.period === 'monthly') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (plan.period === 'yearly') {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    const subscription = {
      id: uuidv4(),
      userId,
      planId,
      status: 'active',
      startsAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      autoRenew: true,
      orderId,
    };

    subscriptions.set(userId, subscription);

    return {
      subscription_id: subscription.id,
      plan_id: planId,
      plan_name: plan.name,
      status: 'active',
      starts_at: subscription.startsAt,
      expires_at: subscription.expiresAt,
      message: `${plan.name}开通成功！`,
    };
  }

  /**
   * 取消订阅（到期后不续费）
   */
  async cancelSubscription(userId) {
    const sub = subscriptions.get(userId);
    if (!sub) {
      throw new Error('当前没有有效订阅');
    }

    sub.autoRenew = false;
    sub.status = 'cancelled';

    return {
      message: '已取消自动续费，当前会员权益将保留至到期日',
      expires_at: sub.expiresAt,
    };
  }

  /**
   * 检查用户是否有权限访问某功能
   */
  async checkFeatureAccess(userId, featureName) {
    const subscription = await this.getUserSubscription(userId);
    const features = subscription.features;

    if (featureName in features) {
      const value = features[featureName];
      // 布尔值特性
      if (typeof value === 'boolean') return value;
      // 数量限制特性（-1表示无限）
      if (typeof value === 'number') return value;
    }

    return false;
  }

  /**
   * 检查内容访问限制
   */
  async checkContentAccess(userId, contentType, contentIndex) {
    const subscription = await this.getUserSubscription(userId);
    const features = subscription.features;

    if (contentType === 'poem') {
      const limit = features.max_poems;
      if (limit === -1) return { allowed: true };
      return {
        allowed: contentIndex < limit,
        limit,
        message: limit <= contentIndex
          ? `免费版仅可收听${limit}首古诗，升级会员解锁全部329首`
          : null,
      };
    }

    if (contentType === 'story') {
      const limit = features.max_stories;
      if (limit === -1) return { allowed: true };
      return {
        allowed: contentIndex < limit,
        limit,
        message: limit <= contentIndex
          ? `免费版仅可收听${limit}个故事，升级会员解锁全部`
          : null,
      };
    }

    return { allowed: true };
  }

  /**
   * 检查声音数量限制
   */
  async checkVoiceLimit(userId, currentVoiceCount) {
    const subscription = await this.getUserSubscription(userId);
    const maxVoices = subscription.features.max_voices;

    if (maxVoices === -1) return { allowed: true };

    return {
      allowed: currentVoiceCount < maxVoices,
      limit: maxVoices,
      current: currentVoiceCount,
      message: currentVoiceCount >= maxVoices
        ? `免费版最多录制${maxVoices}个声音，升级会员可录制4个家庭成员声音`
        : null,
    };
  }

  // ============ 私有方法 ============

  _isExpired(sub) {
    if (!sub.expiresAt) return false;
    return new Date(sub.expiresAt) < new Date();
  }
}

module.exports = new SubscriptionService();
