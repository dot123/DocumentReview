import axios from 'axios';
import { ElMessage } from 'element-plus';

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.code !== 0 && data.code !== undefined) {
      ElMessage.error(data.message || '请求失败');
      return Promise.reject(data);
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      // 已在登录页时不跳转，避免密码错误时刷新页面
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
