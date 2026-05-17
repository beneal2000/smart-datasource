/**
 * 内容库路由 - 古诗/故事内容管理
 */
const express = require('express');
const { query, param } = require('express-validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const contentService = require('../services/contentService');

const router = express.Router();

/**
 * GET /api/v1/content/poems
 * 获取古诗列表
 */
router.get(
  '/poems',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('page_size').optional().isInt({ min: 1, max: 100 }),
    query('grade').optional().isIn(['1', '2', '3', '4', '5', '6']),
    query('dynasty').optional().isString(),
    query('keyword').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const { page = 1, page_size = 20, grade, dynasty, keyword } = req.query;
      const result = await contentService.getPoems({
        page: parseInt(page),
        pageSize: parseInt(page_size),
        grade,
        dynasty,
        keyword,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/content/poems/:id
 * 获取古诗详情（含注音、释义）
 */
router.get('/poems/:id', optionalAuth, async (req, res, next) => {
  try {
    const poem = await contentService.getPoemById(req.params.id);
    if (!poem) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '古诗不存在' },
      });
    }
    res.json({ success: true, data: poem });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/content/stories
 * 获取故事列表
 */
router.get(
  '/stories',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('page_size').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isIn(['fairy_tale', 'fable', 'science', 'history', 'bedtime']),
    query('age_range').optional().isIn(['3-5', '5-7', '7-10']),
    query('keyword').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const { page = 1, page_size = 20, category, age_range, keyword } = req.query;
      const result = await contentService.getStories({
        page: parseInt(page),
        pageSize: parseInt(page_size),
        category,
        ageRange: age_range,
        keyword,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/content/stories/:id
 * 获取故事详情
 */
router.get('/stories/:id', optionalAuth, async (req, res, next) => {
  try {
    const story = await contentService.getStoryById(req.params.id);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '故事不存在' },
      });
    }
    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/content/recommendations
 * 获取推荐内容（基于孩子年龄、历史记录）
 */
router.get('/recommendations', authenticate, async (req, res, next) => {
  try {
    const recommendations = await contentService.getRecommendations(req.user.userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
