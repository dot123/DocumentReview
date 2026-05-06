<template>
  <view class="app">
    <router-view />
  </view>
</template>

<script setup>
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  const token = uni.getStorageSync('token');
  if (token) {
    // 已登录 → 跳到主页(带tabBar)
    uni.switchTab({ url: '/pages/index/index' });
  }
  // 未登录 → 停留在login页（已是首页，无tabBar）
});
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
