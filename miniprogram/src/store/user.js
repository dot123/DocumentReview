import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null);
  const token = ref('');

  // 初始化 - 从本地缓存读取
  function init() {
    const cached = uni.getStorageSync('userInfo');
    if (cached) {
      userInfo.value = JSON.parse(cached);
    }
    token.value = uni.getStorageSync('token') || '';
  }

  // 微信登录
  async function login(code) {
    const res = await request.post('/auth/login', { code });
    token.value = res.data.token;
    userInfo.value = res.data.user;
    uni.setStorageSync('token', res.data.token);
    uni.setStorageSync('userInfo', JSON.stringify(res.data.user));
    return res.data;
  }

  // App设备登录
  async function deviceLogin(deviceId) {
    const res = await request.post('/auth/device-login', { deviceId });
    token.value = res.data.token;
    userInfo.value = res.data.user;
    uni.setStorageSync('token', res.data.token);
    uni.setStorageSync('userInfo', JSON.stringify(res.data.user));
    return res.data;
  }

  // 绑定手机号
  async function bindPhone(code) {
    await request.post('/auth/phone', { code });
    userInfo.value.phone = '已绑定';
    uni.setStorageSync('userInfo', JSON.stringify(userInfo.value));
  }

  // 获取最新用户信息
  async function fetchProfile() {
    const res = await request.get('/auth/profile');
    userInfo.value = res.data;
    uni.setStorageSync('userInfo', JSON.stringify(res.data));
  }

  // 更新用户信息(头像、昵称)
  async function updateProfile(data) {
    await request.put('/auth/profile', data);
    userInfo.value = { ...userInfo.value, ...data };
    uni.setStorageSync('userInfo', JSON.stringify(userInfo.value));
  }

  // 开发模式设置用户
  function setMockUser(t, u) {
    token.value = t;
    userInfo.value = u;
    uni.setStorageSync('token', t);
    uni.setStorageSync('userInfo', JSON.stringify(u));
  }

  // 退出
  function logout() {
    token.value = '';
    userInfo.value = null;
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');
    uni.reLaunch({ url: '/pages/login/login' });
  }

  return { userInfo, token, init, login, deviceLogin, bindPhone, fetchProfile, updateProfile, setMockUser, logout };
});
