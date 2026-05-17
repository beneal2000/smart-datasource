/**
 * 智能推荐路由 - 内容分配 & 每日播放列表
 */
const express = require('express');
const { query, body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const contentAssignService = require('../services/contentAssignService');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/v1/recommend/content
 * 智能推荐内容
 */
router.get('/content', async (req, res, next) => {
  try {
    const { voice_role = 'mother', count = 5, child_age } = req.query;
    const recommendations = await contentAssignService.getRecommendations({
      userId: req.user.userId,
      voiceRole: voice_role,
      childAge: child_age ? parseInt(child_age) : 5,
      count: parseInt(count),
    });
    res.json({ success: true, data: { recommendations } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommend/daily-playlist
 * 获取今日推荐播放列表
 */
router.get('/daily-playlist', async (req, res, next) => {
  try {
    const { voice_role = 'mother', child_age, max_duration = 900 } = req.query;
    const playlist = await contentAssignService.getDailyPlaylist({
      userId: req.user.userId,
      voiceRole: voice_role,
      childAge: child_age ? parseInt(child_age) : 5,
      maxDuration: parseInt(max_duration),
    });
    res.json({ success: true, data: playlist });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/recommend/voice-for-content
 * 为指定内容推荐最合适的声音
 */
router.post('/voice-for-content', async (req, res, next) => {
  try {
    const { content_id, content_type, available_voices } = req.body;
    const recommended = await contentAssignService.recommendVoiceForContent({
      contentId: content_id,
      contentType: content_type,
      availableVoices: available_voices,
    });
    res.json({ success: true, data: { recommended_voice: recommended } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/recommend/rules
 * 设置自定义分配规则
 */
router.post('/rules', async (req, res, next) => {
  try {
    const { voice_role, rules } = req.body;
    const result = await contentAssignService.setUserRules(
      req.user.userId, voice_role, rules
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommend/rules
 * 获取当前分配规则
 */
router.get('/rules', async (req, res, next) => {
  try {
    const { voice_role = 'mother' } = req.query;
    const rules = await contentAssignService.getUserRules(req.user.userId, voice_role);
    res.json({ success: true, data: { voice_role, rules } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
