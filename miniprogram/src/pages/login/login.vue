<template>
  <view class="page">
    <view class="logo-area">
      <view class="logo">📄</view>
      <view class="app-name">智审文书</view>
      <view class="app-desc">专业文书合同智能审核</view>
    </view>

    <view class="login-area">
      <!-- 小程序端：微信一键登录 -->
      <!-- #ifdef MP-WEIXIN -->
      <button class="btn-wx-login" open-type="getPhoneNumber" @getphonenumber="handleGetPhone">
        一键登录
      </button>
      <!-- #endif -->
      <!-- App端：设备一键登录 -->
      <!-- #ifdef APP-PLUS -->
      <button class="btn-wx-login" :disabled="loading" @click="handleAppLogin">
        {{ loading ? '登录中...' : '一键登录' }}
      </button>
      <!-- #endif -->
      <view class="privacy-agree">
        <view class="checkbox" :class="{ checked: agreed }" @click.stop="toggleAgree"></view>
        <view class="privacy-text">
          <text>登录即表示同意</text>
          <text class="link" @tap="goPrivacy">《隐私协议》</text>
          <text>和</text>
          <text class="link" @tap="goAgreement">《用户协议》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../../store/user';
import { wxLogin, deviceLogin } from '../../utils/auth';

const userStore = useUserStore();
const agreed = ref(false);
const loading = ref(false);

function toggleAgree() { agreed.value = !agreed.value; }
function goPrivacy() { uni.navigateTo({ url: '/pages/privacy/privacy' }); }
function goAgreement() { uni.navigateTo({ url: '/pages/user-agreement/user-agreement' }); }

// 微信小程序登录
async function handleGetPhone(e) {
  if (!agreed.value) { uni.showToast({ title: '请先阅读并同意协议', icon: 'none' }); return; }
  try {
    uni.showLoading({ title: '登录中...' });
    const code = await wxLogin();
    await userStore.login(code);
    if (e.detail.errMsg === 'getPhoneNumber:ok') await userStore.bindPhone(e.detail.code);
    uni.hideLoading();
    uni.switchTab({ url: '/pages/index/index' });
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: '登录失败', icon: 'none' });
  }
}

// App端设备登录
async function handleAppLogin() {
  if (!agreed.value) { uni.showToast({ title: '请先阅读并同意协议', icon: 'none' }); return; }
  if (loading.value) return;
  loading.value = true;
  try {
    uni.showLoading({ title: '登录中...' });
    const deviceId = await deviceLogin();
    await userStore.deviceLogin(deviceId);
    uni.hideLoading();
    uni.switchTab({ url: '/pages/index/index' });
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped>
.page {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; padding: 40rpx;
  padding-top: calc(40rpx + var(--status-bar-height)); background: #fff;
}
.logo-area { text-align: center; margin-bottom: 80rpx; }
.logo { font-size: 100rpx; }
.app-name { font-size: 40rpx; font-weight: bold; color: #333; margin-top: 20rpx; }
.app-desc { font-size: 28rpx; color: #999; margin-top: 10rpx; }
.login-area { width: 100%; max-width: 600rpx; }
.btn-wx-login {
  width: 100%; height: 90rpx; line-height: 90rpx;
  background: #07c160; color: #fff; border-radius: 16rpx; font-size: 32rpx; margin-bottom: 20rpx; border: none;
}
.privacy-agree { display: flex; align-items: center; justify-content: center; margin-top: 40rpx; font-size: 24rpx; color: #999; }
.checkbox { width: 32rpx; height: 32rpx; border: 2rpx solid #ddd; border-radius: 6rpx; margin-right: 10rpx; flex-shrink: 0; }
.checkbox.checked { background: #1890ff; border-color: #1890ff; }
.link { color: #1890ff; }
</style>
