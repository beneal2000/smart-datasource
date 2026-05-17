/**
 * 错误处理中间件
 */

/**
 * 404 处理
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `接口不存在: ${req.method} ${req.originalUrl}`,
    },
  });
}

/**
 * 全局错误处理
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Prisma 错误处理
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: '数据已存在',
      },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '数据不存在',
      },
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '认证令牌已过期，请重新登录',
      },
    });
  }

  // 通用错误
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
