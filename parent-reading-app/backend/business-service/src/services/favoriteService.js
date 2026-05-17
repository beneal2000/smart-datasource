/**
 * 收藏服务 - 内容收藏管理
 */
const { v4: uuidv4 } = require('uuid');

// 收藏存储（MVP内存版）
const favorites = new Map();

class FavoriteService {
  /**
   * 获取用户收藏列表
   */
  async getFavorites(userId, contentType = 'all', page = 1, pageSize = 20) {
    const userFavorites = favorites.get(userId) || [];

    let filtered = userFavorites;
    if (contentType !== 'all') {
      filtered = userFavorites.filter((f) => f.contentType === contentType);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { total, page, page_size: pageSize, items };
  }

  /**
   * 添加收藏
   */
  async addFavorite(userId, contentId, contentType) {
    if (!favorites.has(userId)) {
      favorites.set(userId, []);
    }

    const userFavorites = favorites.get(userId);

    // 检查是否已收藏
    const exists = userFavorites.find(
      (f) => f.contentId === contentId && f.contentType === contentType
    );
    if (exists) {
      const error = new Error('已收藏过该内容');
      error.statusCode = 409;
      throw error;
    }

    userFavorites.unshift({
      id: uuidv4(),
      contentId,
      contentType,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId, contentId) {
    const userFavorites = favorites.get(userId) || [];
    const index = userFavorites.findIndex((f) => f.contentId === contentId);

    if (index === -1) {
      const error = new Error('收藏记录不存在');
      error.statusCode = 404;
      throw error;
    }

    userFavorites.splice(index, 1);
    return true;
  }
}

module.exports = new FavoriteService();
