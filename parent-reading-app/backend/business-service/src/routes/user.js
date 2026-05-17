/**
 * 用户路由 - 用户信息管理
 */
const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const userService = require('../services/userService');

const router = express.Router();

// 所有接口需要认证
router.use(authenticate);

/**
 * GET /api/v1/user/profile
 * 获取用户信息
 */
router.get('/profile', async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/user/profile
 * 更新用户信息
 */
router.put(
  '/profile',
  [
    body('nickname').optional().isLength({ max: 20 }).withMessage('昵称最多20字'),
    body('avatar_url').optional().isURL().withMessage('头像URL格式不正确'),
    body('children_age').optional().isInt({ min: 0, max: 18 }).withMessage('年龄范围0-18'),
  ],
  async (req, res, next) => {
    try {
      const updates = req.body;
      const user = await userService.updateProfile(req.user.userId, updates);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/user/subscription
 * 获取订阅状态
 */
router.get('/subscription', async (req, res, next) => {
  try {
    const subscription = await userService.getSubscription(req.user.userId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/user/voices
 * 获取用户已克隆的声音列表
 */
router.get('/voices', async (req, res, next) => {
  try {
    const voices = await userService.getUserVoices(req.user.userId);
    res.json({ success: true, data: voices });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
