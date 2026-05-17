/**
 * 订阅路由 - 会员管理
 */
const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const subscriptionService = require('../services/subscriptionService');

const router = express.Router();

/**
 * GET /api/v1/subscription/plans
 * 获取所有订阅计划（无需登录）
 */
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
});

// 以下接口需要认证
router.use(authenticate);

/**
 * GET /api/v1/subscription/status
 * 获取当前用户订阅状态
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await subscriptionService.getUserSubscription(req.user.userId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/subscription/order
 * 创建订阅订单
 */
router.post(
  '/order',
  [body('plan_id').isIn(['premium_monthly', 'premium_yearly']).withMessage('无效的订阅计划')],
  async (req, res, next) => {
    try {
      const { plan_id } = req.body;
      const order = await subscriptionService.createOrder(req.user.userId, plan_id);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/subscription/confirm
 * 确认支付（模拟支付回调）
 */
router.post(
  '/confirm',
  [
    body('order_id').notEmpty(),
    body('plan_id').isIn(['premium_monthly', 'premium_yearly']),
  ],
  async (req, res, next) => {
    try {
      const { order_id, plan_id } = req.body;
      const result = await subscriptionService.confirmPayment(
        req.user.userId, order_id, plan_id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/subscription/cancel
 * 取消自动续费
 */
router.post('/cancel', async (req, res, next) => {
  try {
    const result = await subscriptionService.cancelSubscription(req.user.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/subscription/check/:feature
 * 检查功能权限
 */
router.get('/check/:feature', async (req, res, next) => {
  try {
    const allowed = await subscriptionService.checkFeatureAccess(
      req.user.userId, req.params.feature
    );
    res.json({ success: true, data: { feature: req.params.feature, allowed } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
