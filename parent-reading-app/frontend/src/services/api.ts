/**
 * API 服务层 - 统一HTTP请求封装
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.parent-reading.com/api/v1';

// 创建 Axios 实例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动附加Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token过期，执行登出
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ============ 认证相关 ============
export const authAPI = {
  sendSMS: (phone: string) => api.post('/auth/sms/send', { phone }),
  login: (phone: string, code: string) => api.post('/auth/login', { phone, code }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// ============ 内容相关 ============
export const contentAPI = {
  getPoems: (params?: any) => api.get('/content/poems', { params }),
  getPoemById: (id: string) => api.get(`/content/poems/${id}`),
  getStories: (params?: any) => api.get('/content/stories', { params }),
  getStoryById: (id: string) => api.get(`/content/stories/${id}`),
  getRecommendations: () => api.get('/content/recommendations'),
};

// ============ 声音克隆相关 ============
export const voiceAPI = {
  uploadRecording: (formData: FormData) =>
    api.post('/ai/voice/clone', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2分钟超时
    }),
  getCloneStatus: (taskId: string) => api.get(`/ai/voice/clone/status/${taskId}`),
  getVoiceProfiles: (userId: string) => api.get(`/ai/voice/profiles/${userId}`),
  deleteVoice: (userId: string, voiceId: string) =>
    api.delete(`/ai/voice/profiles/${userId}/${voiceId}`),
};

// ============ 播放相关 ============
export const playAPI = {
  generateAudio: (params: {
    content_id: string;
    content_type: 'poem' | 'story';
    voice_id: string;
    speed?: number;
    music_id?: string;
    voice_volume?: number;
    music_volume?: number;
  }) => api.post('/play/generate', params),
  recordPlay: (params: any) => api.post('/play/record', params),
  getHistory: (params?: any) => api.get('/play/history', { params }),
  getStats: () => api.get('/play/stats'),
};

// ============ 收藏相关 ============
export const favoriteAPI = {
  getFavorites: (params?: any) => api.get('/favorites', { params }),
  addFavorite: (contentId: string, contentType: string) =>
    api.post('/favorites', { content_id: contentId, content_type: contentType }),
  removeFavorite: (contentId: string) => api.delete(`/favorites/${contentId}`),
};

// ============ 音频相关 ============
export const audioAPI = {
  getMusicList: (category?: string) => api.get('/ai/audio/music/list', { params: { category } }),
  mixAudio: (params: any) => api.post('/ai/audio/mix', params),
};

export default api;
