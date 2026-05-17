/**
 * 业务服务配置
 */
module.exports = {
  // 基础配置
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,

  // CORS配置
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:8081'],

  // JWT配置
  JWT_SECRET: process.env.JWT_SECRET || 'parent-reading-dev-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // AI服务配置
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  // Redis配置
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // 文件上传配置
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE) || 50 * 1024 * 1024, // 50MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  // 短信验证码配置（后期接入阿里云短信）
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mock',
  SMS_ACCESS_KEY: process.env.SMS_ACCESS_KEY,
  SMS_SECRET_KEY: process.env.SMS_SECRET_KEY,
  SMS_SIGN_NAME: process.env.SMS_SIGN_NAME || '亲子伴读',
  SMS_TEMPLATE_CODE: process.env.SMS_TEMPLATE_CODE,

  // 分页默认值
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
