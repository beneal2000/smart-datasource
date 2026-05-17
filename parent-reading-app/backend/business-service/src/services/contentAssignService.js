/**
 * 内容智能分配服务
 *
 * 根据以下规则为不同家庭成员分配内容：
 * 1. 声音角色偏好：妈妈偏向温柔古诗，爸爸偏向故事/激昂内容
 * 2. 孩子年龄匹配：根据年龄推荐合适难度
 * 3. 时间场景：睡前推荐哄睡内容，白天推荐活泼内容
 * 4. 历史记录：避免重复，优先未听过的
 * 5. 用户自定义规则覆盖
 */

// 默认分配规则
const DEFAULT_ASSIGNMENT_RULES = {
  mother: {
    preferred_types: ['poem'],
    preferred_emotions: ['gentle', 'sad', 'sleepy'],
    preferred_styles: ['chant', 'recite'],
    preferred_categories: [], // 故事分类
    weight: 0.7, // 古诗权重
  },
  father: {
    preferred_types: ['story'],
    preferred_emotions: ['excited', 'happy', 'playful'],
    preferred_styles: ['story_tell', 'recite'],
    preferred_categories: ['fairy_tale', 'fable', 'history'],
    weight: 0.7, // 故事权重
  },
  grandma: {
    preferred_types: ['poem'],
    preferred_emotions: ['gentle', 'sleepy'],
    preferred_styles: ['chant', 'sing_song'],
    preferred_categories: ['bedtime'],
    weight: 0.6,
  },
  grandpa: {
    preferred_types: ['poem', 'story'],
    preferred_emotions: ['solemn', 'excited'],
    preferred_styles: ['recite', 'story_tell'],
    preferred_categories: ['history', 'fable'],
    weight: 0.5,
  },
};

// 时段场景映射
const TIME_SCENE_MAP = {
  morning: { emotions: ['happy', 'playful', 'excited'], types: ['poem'] },     // 6-9点
  daytime: { emotions: ['happy', 'excited', 'playful'], types: ['story'] },    // 9-17点
  evening: { emotions: ['gentle', 'happy'], types: ['poem', 'story'] },         // 17-20点
  bedtime: { emotions: ['sleepy', 'gentle'], types: ['poem'] },                 // 20-22点
  night: { emotions: ['sleepy'], types: ['poem'] },                             // 22点后
};

// 用户自定义规则存储
const userRules = new Map();

class ContentAssignService {
  /**
   * 智能推荐内容
   *
   * 根据角色、时间、历史等因素推荐最合适的内容。
   */
  async getRecommendations({
    userId,
    voiceRole = 'mother',
    childAge = 5,
    count = 5,
    scene = null,
    excludeIds = [],
  }) {
    // 加载内容库
    const poems = this._loadPoems();
    const stories = this._loadStories();

    // 获取分配规则
    const rules = this._getUserRules(userId, voiceRole);
    const timeScene = scene || this._detectTimeScene();

    // 计算每首内容的推荐分数
    let candidates = [];

    // 古诗候选
    for (const poem of poems) {
      if (excludeIds.includes(poem.id)) continue;

      let score = 0;

      // 年龄匹配
      const gradeMatch = this._gradeMatchScore(poem.grade, childAge);
      score += gradeMatch * 30;

      // 角色偏好匹配
      if (rules.preferred_types.includes('poem')) score += rules.weight * 20;
      if (rules.preferred_emotions.includes(poem.emotion)) score += 25;
      if (rules.preferred_styles.includes(poem.poem_style)) score += 15;

      // 时间场景匹配
      if (timeScene.emotions.includes(poem.emotion)) score += 20;
      if (timeScene.types.includes('poem')) score += 10;

      // 随机扰动（避免每次结果相同）
      score += Math.random() * 10;

      candidates.push({
        id: poem.id,
        type: 'poem',
        title: poem.title,
        author: poem.author,
        emotion: poem.emotion,
        poem_style: poem.poem_style,
        grade: poem.grade,
        score,
        reason: this._generateReason(voiceRole, poem.emotion, timeScene),
      });
    }

    // 故事候选
    for (const story of stories) {
      if (excludeIds.includes(story.id)) continue;

      let score = 0;

      // 年龄匹配
      const ageMatch = this._ageRangeMatch(story.age_range, childAge);
      score += ageMatch * 30;

      // 角色偏好
      if (rules.preferred_types.includes('story')) score += rules.weight * 20;
      if (rules.preferred_categories.includes(story.category)) score += 20;
      if (rules.preferred_emotions.includes(story.emotion)) score += 15;

      // 时间场景
      if (timeScene.types.includes('story')) score += 15;
      if (timeScene.emotions.includes(story.emotion)) score += 10;

      score += Math.random() * 10;

      candidates.push({
        id: story.id,
        type: 'story',
        title: story.title,
        category: story.category,
        emotion: story.emotion,
        age_range: story.age_range,
        score,
        reason: this._generateReason(voiceRole, story.emotion, timeScene),
      });
    }

    // 按分数排序取前N
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, count);
  }

  /**
   * 为指定内容推荐最合适的声音角色
   */
  async recommendVoiceForContent({ contentId, contentType, availableVoices }) {
    if (!availableVoices || availableVoices.length === 0) {
      return null;
    }

    // 加载内容
    let content = null;
    if (contentType === 'poem') {
      const poems = this._loadPoems();
      content = poems.find(p => p.id === contentId);
    } else {
      const stories = this._loadStories();
      content = stories.find(s => s.id === contentId);
    }

    if (!content) return availableVoices[0];

    // 为每个声音计算匹配分
    const scored = availableVoices.map(voice => {
      const rules = DEFAULT_ASSIGNMENT_RULES[voice.voice_role] || DEFAULT_ASSIGNMENT_RULES.mother;
      let score = 0;

      if (rules.preferred_types.includes(contentType)) score += 30;
      if (content.emotion && rules.preferred_emotions.includes(content.emotion)) score += 40;
      if (content.poem_style && rules.preferred_styles.includes(content.poem_style)) score += 20;
      if (content.category && rules.preferred_categories.includes(content.category)) score += 25;

      return { ...voice, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }

  /**
   * 设置用户自定义分配规则
   */
  async setUserRules(userId, voiceRole, customRules) {
    const key = `${userId}_${voiceRole}`;
    const existing = userRules.get(key) || { ...DEFAULT_ASSIGNMENT_RULES[voiceRole] };

    userRules.set(key, {
      ...existing,
      ...customRules,
    });

    return { message: '分配规则已更新', rules: userRules.get(key) };
  }

  /**
   * 获取用户分配规则
   */
  async getUserRules(userId, voiceRole) {
    return this._getUserRules(userId, voiceRole);
  }

  /**
   * 获取今日推荐播放列表
   */
  async getDailyPlaylist({ userId, voiceRole, childAge = 5, maxDuration = 900 }) {
    const recommendations = await this.getRecommendations({
      userId,
      voiceRole,
      childAge,
      count: 20, // 取更多候选
    });

    // 组合播放列表，控制总时长
    const playlist = [];
    let totalDuration = 0;

    for (const item of recommendations) {
      const estimatedDuration = item.type === 'poem' ? 60 : 180; // 估算
      if (totalDuration + estimatedDuration > maxDuration) break;

      playlist.push(item);
      totalDuration += estimatedDuration;
    }

    return {
      voice_role: voiceRole,
      items: playlist,
      total_items: playlist.length,
      estimated_duration: totalDuration,
      scene: this._detectTimeScene(),
    };
  }

  // ============ 私有方法 ============

  _getUserRules(userId, voiceRole) {
    const key = `${userId}_${voiceRole}`;
    return userRules.get(key) || DEFAULT_ASSIGNMENT_RULES[voiceRole] || DEFAULT_ASSIGNMENT_RULES.mother;
  }

  _detectTimeScene() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return TIME_SCENE_MAP.morning;
    if (hour >= 9 && hour < 17) return TIME_SCENE_MAP.daytime;
    if (hour >= 17 && hour < 20) return TIME_SCENE_MAP.evening;
    if (hour >= 20 && hour < 22) return TIME_SCENE_MAP.bedtime;
    return TIME_SCENE_MAP.night;
  }

  _gradeMatchScore(poemGrade, childAge) {
    if (!poemGrade) return 0.5;
    // 年龄到年级：6岁=1年级
    const childGrade = Math.max(1, childAge - 5);
    const diff = Math.abs(poemGrade - childGrade);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.7;
    if (diff === 2) return 0.4;
    return 0.2;
  }

  _ageRangeMatch(ageRange, childAge) {
    if (!ageRange) return 0.5;
    const [min, max] = ageRange.split('-').map(Number);
    if (childAge >= min && childAge <= max) return 1.0;
    if (childAge === min - 1 || childAge === max + 1) return 0.6;
    return 0.3;
  }

  _generateReason(voiceRole, emotion, timeScene) {
    const roleLabel = { mother: '妈妈', father: '爸爸', grandma: '奶奶', grandpa: '爷爷' };
    const emotionLabel = {
      gentle: '温柔', happy: '欢快', sad: '思乡', sleepy: '哄睡',
      excited: '激昂', playful: '活泼', solemn: '庄重',
    };

    const role = roleLabel[voiceRole] || '家长';
    const emo = emotionLabel[emotion] || '';
    return `推荐${role}用${emo}的语气来读`;
  }

  _loadPoems() {
    try {
      return require('../../content/poems.json');
    } catch { return []; }
  }

  _loadStories() {
    try {
      return require('../../content/stories.json');
    } catch { return []; }
  }
}

module.exports = new ContentAssignService();
