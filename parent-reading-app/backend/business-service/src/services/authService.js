/**
 * 认证服务 - 手机号验证码登录/注册
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// MVP阶段使用内存存储，后期替换为数据库
const users = new Map();
const verificationCodes = new Map();

class AuthService {
  /**
   * 发送验证码
   */
  async sendVerificationCode(phone) {
    // 生成6位数字验证码
    const code = Math.random().toString().slice(2, 8);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟有效期

    verificationCodes.set(phone, { code, expiresAt });

    // MVP阶段：打印到控制台（后期替换为阿里云短信API）
    if (config.SMS_PROVIDER === 'mock') {
      console.log(`📱 [Mock SMS] 手机号: ${phone}, 验证码: ${code}`);
    } else {
      // 调用阿里云短信API
      await this._sendAliyunSMS(phone, code);
    }

    return true;
  }

  /**
   * 手机号 + 验证码登录（自动注册）
   */
  async loginWithSMS(phone, code) {
    // 验证验证码
    const stored = verificationCodes.get(phone);
    if (!stored) {
      const error = new Error('请先获取验证码');
      error.statusCode = 400;
      throw error;
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(phone);
      const error = new Error('验证码已过期，请重新获取');
      error.statusCode = 400;
      throw error;
    }

    if (stored.code !== code) {
      const error = new Error('验证码错误');
      error.statusCode = 400;
      throw error;
    }

    // 验证通过，删除验证码
    verificationCodes.delete(phone);

    // 查找或创建用户
    let user = this._findUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      user = this._createUser(phone);
      isNewUser = true;
    }

    // 生成Token
    const token = this._generateToken(user);
    const refreshToken = this._generateRefreshToken(user);

    return {
      user: {
        user_id: user.userId,
        phone: user.phone,
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
        subscription_type: user.subscriptionType,
        created_at: user.createdAt,
      },
      token,
      refreshToken,
      isNewUser,
    };
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET + '_refresh');
      const user = users.get(decoded.userId);

      if (!user) {
        const error = new Error('用户不存在');
        error.statusCode = 401;
        throw error;
      }

      const newToken = this._generateToken(user);
      const newRefreshToken = this._generateRefreshToken(user);

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (err.statusCode) throw err;
      const error = new Error('refresh_token无效或已过期');
      error.statusCode = 401;
      throw error;
    }
  }

  // ============ 私有方法 ============

  _findUserByPhone(phone) {
    for (const user of users.values()) {
      if (user.phone === phone) return user;
    }
    return null;
  }

  _createUser(phone) {
    const userId = uuidv4();
    const user = {
      userId,
      phone,
      nickname: `用户${phone.slice(-4)}`,
      avatarUrl: null,
      subscriptionType: 'free',
      childrenAge: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.set(userId, user);
    return user;
  }

  _generateToken(user) {
    return jwt.sign(
      { userId: user.userId, phone: user.phone, role: 'user' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  _generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.userId },
      config.JWT_SECRET + '_refresh',
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );
  }

  async _sendAliyunSMS(phone, code) {
    // 阿里云短信API调用（后期实现）
    console.log(`[Aliyun SMS] Sending code ${code} to ${phone}`);
  }
}

module.exports = new AuthService();
