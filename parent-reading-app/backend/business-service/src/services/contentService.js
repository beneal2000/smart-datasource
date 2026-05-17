/**
 * 内容服务 - 古诗/故事内容管理
 */

// MVP阶段使用内存数据，后期替换为数据库
// 初始数据见 content/ 目录
let poems = [];
let stories = [];

class ContentService {
  constructor() {
    this._loadInitialData();
  }

  /**
   * 加载初始内容数据
   */
  _loadInitialData() {
    try {
      poems = require('../../content/poems.json');
      stories = require('../../content/stories.json');
      console.log(`📚 内容库加载完成: ${poems.length}首古诗, ${stories.length}个故事`);
    } catch (error) {
      console.warn('⚠️ 内容数据加载失败，使用空数据:', error.message);
      poems = [];
      stories = [];
    }
  }

  /**
   * 获取古诗列表
   */
  async getPoems({ page = 1, pageSize = 20, grade, dynasty, keyword }) {
    let filtered = [...poems];

    // 筛选
    if (grade) {
      filtered = filtered.filter((p) => p.grade === parseInt(grade));
    }
    if (dynasty) {
      filtered = filtered.filter((p) => p.dynasty === dynasty);
    }
    if (keyword) {
      filtered = filtered.filter(
        (p) => p.title.includes(keyword) || p.author.includes(keyword) || p.content.includes(keyword)
      );
    }

    // 分页
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      total,
      page,
      page_size: pageSize,
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        author: p.author,
        dynasty: p.dynasty,
        content: p.content,
        grade: p.grade,
        tags: p.tags,
      })),
    };
  }

  /**
   * 获取古诗详情
   */
  async getPoemById(id) {
    return poems.find((p) => p.id === id) || null;
  }

  /**
   * 获取故事列表
   */
  async getStories({ page = 1, pageSize = 20, category, ageRange, keyword }) {
    let filtered = [...stories];

    if (category) {
      filtered = filtered.filter((s) => s.category === category);
    }
    if (ageRange) {
      filtered = filtered.filter((s) => s.age_range === ageRange);
    }
    if (keyword) {
      filtered = filtered.filter(
        (s) => s.title.includes(keyword) || s.summary.includes(keyword)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      total,
      page,
      page_size: pageSize,
      items: items.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        age_range: s.age_range,
        summary: s.summary,
        duration_estimate: s.duration_estimate,
        cover_image: s.cover_image,
      })),
    };
  }

  /**
   * 获取故事详情
   */
  async getStoryById(id) {
    return stories.find((s) => s.id === id) || null;
  }

  /**
   * 获取推荐内容
   */
  async getRecommendations(userId) {
    // MVP: 随机推荐
    const recommendedPoems = this._getRandomItems(poems, 5);
    const recommendedStories = this._getRandomItems(stories, 3);

    return {
      poems: recommendedPoems.map((p) => ({
        id: p.id,
        title: p.title,
        author: p.author,
        dynasty: p.dynasty,
      })),
      stories: recommendedStories.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        summary: s.summary,
      })),
    };
  }

  _getRandomItems(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

module.exports = new ContentService();
