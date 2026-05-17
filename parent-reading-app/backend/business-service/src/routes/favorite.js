/**
 * 收藏路由 - 内容收藏管理
 */
const express = require('express');
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const favoriteService = require('../services/favoriteService');

const router = express.Router();

// 所有接口需要认证
router.use(authenticate);

/**
 * GET /api/v1/favorites
 * 获取收藏列表
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('page_size').optional().isInt({ min: 1, max: 50 }),
    query('content_type').optional().isIn(['poem', 'story', 'all']),
  ],
  async (req, res, next) => {
    try {
      const { page = 1, page_size = 20, content_type = 'all' } = req.query;
      const result = await favoriteService.getFavorites(
        req.user.userId,
        content_type,
        parseInt(page),
        parseInt(page_size)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/favorites
 * 添加收藏
 */
router.post(
  '/',
  [
    body('content_id').notEmpty().withMessage('内容ID不能为空'),
    body('content_type').isIn(['poem', 'story']).withMessage('类型必须是poem或story'),
  ],
  async (req, res, next) => {
    try {
      const { content_id, content_type } = req.body;
      await favoriteService.addFavorite(req.user.userId, content_id, content_type);
      res.json({ success: true, data: { message: '收藏成功' } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/favorites/:content_id
 * 取消收藏
 */
router.delete('/:content_id', async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(req.user.userId, req.params.content_id);
    res.json({ success: true, data: { message: '已取消收藏' } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
