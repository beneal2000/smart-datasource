/**
 * 亲子伴读 App - 业务后端服务入口
 *
 * 职责：
 * - 用户账号体系（注册/登录/JWT认证）
 * - 内容库管理（古诗/故事CRUD）
 * - 播放记录与收藏
 * - API网关（代理转发AI服务请求）
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// 路由引入
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const contentRoutes = require('./routes/content');
const playRoutes = require('./routes/play');
const favoriteRoutes = require('./routes/favorite');
const subscriptionRoutes = require('./routes/subscription');
const recommendRoutes = require('./routes/recommend');
const proxyRoutes = require('./routes/aiProxy');

const app = express();

// ============ 中间件 ============
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// ============ 路由注册 ============
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'business-service', version: '0.1.0' });
});

// 认证相关（无需JWT）
app.use('/api/v1/auth', authRoutes);

// 业务接口（需要JWT认证）
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/play', playRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/recommend', recommendRoutes);

// AI服务代理（需要JWT认证）
app.use('/api/v1/ai', proxyRoutes);

// ============ 错误处理 ============
app.use(notFoundHandler);
app.use(errorHandler);

// ============ 启动服务 ============
const PORT = config.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 亲子伴读业务服务启动成功`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🌍 环境: ${config.NODE_ENV}`);
  console.log(`🔗 AI服务地址: ${config.AI_SERVICE_URL}`);
});

module.exports = app;
