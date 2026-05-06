<template>
  <view class="page">
    <template v-if="loggedIn">
      <!-- 头像昵称区域 - 使用微信原生能力 -->
      <view class="user-header">
        <view class="avatar-wrap" @click="goEditProfile">
          <image v-if="userData.avatar_url && userData.avatar_url.length > 0" class="avatar-img" :src="avatarSrc" mode="aspectFill" />
          <view v-else class="avatar-default"></view>
        </view>
        <view class="user-info">
          <text class="nickname">{{ userData.nickname }}</text>
          <text class="uid">ID: {{ userData.id }}</text>
          <view class="member-badge" :class="'badge-' + (userData.member_level || 'free')">
            {{ memberLabel }}
          </view>
        </view>
      </view>

      <view class="stats-row">
        <view class="stat-item"><text class="stat-num">{{ stats.fileCount }}</text><text class="stat-label">上传文件</text></view>
        <view class="stat-item"><text class="stat-num">{{ stats.reviewCount }}</text><text class="stat-label">审核次数</text></view>
        <view class="stat-item" @click="goInvite"><text class="stat-num">{{ stats.inviteCount }}</text><text class="stat-label">邀请好友</text></view>
      </view>

      <view class="menu-list">
        <view class="menu-item" @click="goInvite"><text>邀请好友</text><text class="arrow">></text></view>
        <view class="menu-item" @click="goMember"><text>会员中心</text><text class="arrow">></text></view>
        <view class="menu-item" @click="goPrivacy"><text>隐私协议</text><text class="arrow">></text></view>
        <view class="menu-item" @click="goAgreement"><text>用户协议</text><text class="arrow">></text></view>
      </view>

      <button class="btn-logout" @click="doLogout">退出登录</button>
    </template>

    <template v-else>
      <view class="empty-login">
        <view class="empty-icon">📄</view>
        <text class="empty-text">尚未登录</text>
        <button class="btn-login" @click="goLogin">立即登录</button>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../store/user';
import request from '../../utils/request';
import { API_HOST } from '../../config';

const userStore = useUserStore();
const loggedIn = ref(false);
const userData = ref({});
const stats = ref({ fileCount: 0, reviewCount: 0, inviteCount: 0 });

onShow(() => {
  const token = uni.getStorageSync('token');
  if (token) {
    loggedIn.value = true;
    // 先从storage快速显示，再从后端刷新最新数据
    loadUserData();
    loadStats();
  } else {
    loggedIn.value = false;
    userData.value = {};
  }
});

async function loadUserData() {
  try {
    const res = await request.get('/auth/profile');
    userData.value = res.data;
    uni.setStorageSync('userInfo', JSON.stringify(res.data));
  } catch(e) {
    // 后端不可用时从storage读取
    const info = uni.getStorageSync('userInfo');
    if (info) {
      try { userData.value = typeof info === 'string' ? JSON.parse(info) : info; }
      catch(_) { userData.value = { nickname: '用户' }; }
    }
  }
}

const avatarSrc = computed(() => {
  const url = userData.value.avatar_url;
  if (!url) return '';
  return url.startsWith('/uploads/') ? API_HOST + url : url;
});

const memberLabel = computed(() => {
  const map = { free: '普通用户', vip: 'VIP会员', svip: 'SVIP会员' };
  return map[userData.value.member_level || 'free'];
});

async function loadStats() {
  try {
    const [f, r, i] = await Promise.all([
      request.get('/files', { page: 1, pageSize: 1 }),
      request.get('/review', { page: 1, pageSize: 1 }),
      request.get('/marketing/stats'),
    ]);
    stats.value = { fileCount: f.data?.total || 0, reviewCount: r.data?.total || 0, inviteCount: i.data?.invite_count || 0 };
  } catch(_) {}
}

function goEditProfile() { uni.navigateTo({ url: '/pages/edit-profile/edit-profile' }); }
function goLogin() { uni.reLaunch({ url: '/pages/login/login' }); }
function goInvite() { uni.navigateTo({ url: '/pages/invite/invite' }); }
function goMember() { uni.navigateTo({ url: '/pages/member/member' }); }
function goPrivacy() { uni.navigateTo({ url: '/pages/privacy/privacy' }); }
function goAgreement() { uni.navigateTo({ url: '/pages/user-agreement/user-agreement' }); }

function doLogout() {
  uni.showModal({
    title: '退出',
    content: '确定退出登录？',
    success(res) {
      if (res.confirm) {
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        loggedIn.value = false;
        userData.value = {};
        uni.switchTab({ url: '/pages/index/index' });
      }
    },
  });
}
</script>

<style scoped>
.page { padding: 30rpx; }
.user-header { display: flex; align-items: center; gap: 24rpx; background: #fff; padding: 30rpx; border-radius: 16rpx; margin-bottom: 20rpx; }
.avatar-btn { width: 100rpx; height: 100rpx; padding: 0; margin: 0; background: none; border: none; border-radius: 50%; flex-shrink: 0; line-height: 1; }
.avatar-btn::after { border: none; }
.avatar-wrap { flex-shrink: 0; }
.avatar-default, .avatar-img { width: 100rpx; height: 100rpx; border-radius: 50%; }
.avatar-default { background: #e8e8e8; }
.avatar-img { object-fit: cover; display: block; }
.user-info { flex: 1; }
.nickname-input { font-size: 34rpx; font-weight: bold; height: 50rpx; line-height: 50rpx; padding: 0; }
.phone { font-size: 26rpx; color: #999; display: block; margin-top: 6rpx; }
.uid { font-size: 26rpx; color: #999; display: block; margin-top: 6rpx; }
.member-badge { display: inline-block; font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 20rpx; margin-top: 8rpx; }
.badge-free { background: #f5f5f5; color: #999; }
.badge-vip { background: #fffbe6; color: #faad14; }
.badge-svip { background: #fff1f0; color: #ff4d4f; }

.stats-row { display: flex; background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.stat-item { flex: 1; text-align: center; }
.stat-num { font-size: 36rpx; font-weight: bold; color: #1890ff; display: block; }
.stat-label { font-size: 24rpx; color: #999; }

.menu-list { background: #fff; border-radius: 16rpx; margin-bottom: 40rpx; }
.menu-item { display: flex; justify-content: space-between; padding: 28rpx 30rpx; font-size: 30rpx; border-bottom: 1rpx solid #f5f5f5; }
.menu-item:last-child { border-bottom: none; }
.arrow { color: #ccc; }
.btn-logout { width: 100%; background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 12rpx; font-size: 30rpx; margin-top: 20rpx; }

.empty-login { text-align: center; padding: 200rpx 40rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 30rpx; color: #999; display: block; margin: 20rpx 0; }
.btn-login { background: #1890ff; color: #fff; border-radius: 12rpx; font-size: 30rpx; margin-top: 30rpx; width: 300rpx; }
</style>
