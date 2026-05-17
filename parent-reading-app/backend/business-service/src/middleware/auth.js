/**
 * JWT 认证中间件
 */
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 验证JWT Token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: '请先登录',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 可选认证（不强制要求，但有token则解析）
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
      };
    } catch {
      // Token无效时不阻断请求
    }
  }

  next();
}

module.exports = { authenticate, optionalAuth };
