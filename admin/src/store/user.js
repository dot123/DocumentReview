import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as loginApi, getProfile } from '../api/auth';

export const useUserStore = defineStore('adminUser', () => {
  const token = ref('');
  const userInfo = ref(null);

  function init() {
    token.value = localStorage.getItem('admin_token') || '';
  }

  async function login(username, password) {
    // 管理后台使用独立的管理员登录
    const res = await loginApi(username, password);
    token.value = res.data.token;
    userInfo.value = res.data.user;
    localStorage.setItem('admin_token', res.data.token);
    return res.data;
  }

  async function fetchProfile() {
    const res = await getProfile();
    userInfo.value = res.data;
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('admin_token');
  }

  return { token, userInfo, init, login, fetchProfile, logout };
});
