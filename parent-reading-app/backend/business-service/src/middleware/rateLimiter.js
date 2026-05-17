/**
 * 请求频率限制中间件
 */
const rateLimit = require('express-rate-limit');

// 通用限制：每IP每分钟100次
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 认证接口限制：每IP每分钟10次（防暴力破解）
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: '登录尝试过于频繁，请1分钟后再试',
    },
  },
});

// 短信发送限制：每IP每分钟3次
const smsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: {
      code: 'SMS_RATE_LIMIT',
      message: '验证码发送过于频繁，请稍后再试',
    },
  },
});

module.exports = { rateLimiter, authLimiter, smsLimiter };
