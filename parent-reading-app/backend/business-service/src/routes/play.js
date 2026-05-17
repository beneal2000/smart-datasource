/**
 * 播放路由 - 播放记录与播放控制
 */
const express = require('express');
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const playService = require('../services/playService');

const router = express.Router();

// 所有接口需要认证
router.use(authenticate);

/**
 * POST /api/v1/play/generate
 * 生成播放音频（TTS合成 + 混音）
 *
 * 核心接口：整合AI服务，生成最终可播放的音频
 */
router.post(
  '/generate',
  [
    body('content_id').notEmpty().withMessage('内容ID不能为空'),
    body('content_type').isIn(['poem', 'story']).withMessage('类型必须是poem或story'),
    body('voice_id').notEmpty().withMessage('声音ID不能为空'),
    body('speed').optional().isFloat({ min: 0.5, max: 2.0 }),
    body('music_id').optional().isString(),
    body('voice_volume').optional().isFloat({ min: 0, max: 1 }),
    body('music_volume').optional().isFloat({ min: 0, max: 1 }),
  ],
  async (req, res, next) => {
    try {
      const {
        content_id,
        content_type,
        voice_id,
        speed = 1.0,
        music_id,
        voice_volume = 0.7,
        music_volume = 0.3,
      } = req.body;

      const result = await playService.generateAudio({
        userId: req.user.userId,
        contentId: content_id,
        contentType: content_type,
        voiceId: voice_id,
        speed,
        musicId: music_id,
        voiceVolume: voice_volume,
        musicVolume: music_volume,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/play/record
 * 记录播放行为
 */
router.post(
  '/record',
  [
    body('content_id').notEmpty(),
    body('content_type').isIn(['poem', 'story']),
    body('duration').isInt({ min: 0 }).withMessage('播放时长不能为负'),
    body('completed').isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const { content_id, content_type, duration, completed } = req.body;
      await playService.recordPlay({
        userId: req.user.userId,
        contentId: content_id,
        contentType: content_type,
        duration,
        completed,
      });

      res.json({ success: true, data: { message: '记录成功' } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/play/history
 * 获取播放历史
 */
router.get(
  '/history',
  [
    query('page').optional().isInt({ min: 1 }),
    query('page_size').optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res, next) => {
    try {
      const { page = 1, page_size = 20 } = req.query;
      const result = await playService.getHistory(
        req.user.userId,
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
 * GET /api/v1/play/stats
 * 获取播放统计（今日/本周/总计）
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await playService.getStats(req.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
