/**
 * 认证路由 - 手机号注册/登录
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authLimiter, smsLimiter } = require('../middleware/rateLimiter');
const authService = require('../services/authService');

const router = express.Router();

/**
 * POST /api/v1/auth/sms/send
 * 发送短信验证码
 */
router.post(
  '/sms/send',
  smsLimiter,
  [body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg },
        });
      }

      const { phone } = req.body;
      await authService.sendVerificationCode(phone);

      res.json({
        success: true,
        data: { message: '验证码已发送', expires_in: 300 },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/login
 * 手机号 + 验证码登录（自动注册）
 */
router.post(
  '/login',
  authLimiter,
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('验证码为6位数字'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg },
        });
      }

      const { phone, code } = req.body;
      const result = await authService.loginWithSMS(phone, code);

      res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          refresh_token: result.refreshToken,
          is_new_user: result.isNewUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * 刷新Token
 */
router.post(
  '/refresh',
  [body('refresh_token').notEmpty().withMessage('refresh_token不能为空')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg },
        });
      }

      const { refresh_token } = req.body;
      const result = await authService.refreshToken(refresh_token);

      res.json({
        success: true,
        data: { token: result.token, refresh_token: result.refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
