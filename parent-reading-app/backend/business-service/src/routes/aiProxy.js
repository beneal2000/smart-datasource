/**
 * AI服务代理路由
 *
 * 将前端的AI请求转发至Python AI服务，
 * 附加用户认证信息，实现统一入口。
 */
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// 所有AI代理接口需要认证
router.use(authenticate);

/**
 * 代理配置：转发 /api/v1/ai/* 到 AI 服务
 *
 * /api/v1/ai/voice/*   → AI服务 /api/v1/voice/*
 * /api/v1/ai/tts/*     → AI服务 /api/v1/tts/*
 * /api/v1/ai/audio/*   → AI服务 /api/v1/audio/*
 */
const aiProxy = createProxyMiddleware({
  target: config.AI_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/ai': '/api/v1',
  },
  onProxyReq(proxyReq, req) {
    // 附加用户信息到请求头
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Phone', req.user.phone || '');
    }
  },
  onError(err, req, res) {
    console.error('AI Service Proxy Error:', err.message);
    res.status(502).json({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI服务暂时不可用，请稍后重试',
      },
    });
  },
});

router.use('/', aiProxy);

module.exports = router;
