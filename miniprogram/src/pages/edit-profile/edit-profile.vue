<template>
  <view class="page">
    <button class="avatar-picker" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
      <image v-if="avatarUrl" class="avatar-img" :src="avatarUrl" mode="aspectFill" />
      <view v-else class="avatar-empty">+</view>
    </button>
    <view class="avatar-tip">点击设置头像</view>

    <view class="field">
      <text class="label">昵称</text>
      <input class="input" type="nickname" v-model="nickname" placeholder="请输入昵称" />
    </view>

    <button class="btn-save" @click="save" :loading="saving">保存</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '../../store/user';
import request from '../../utils/request';
import { API_HOST } from '../../config';

const userStore = useUserStore();
const avatarUrl = ref('');
const nickname = ref('');
const saving = ref(false);

onLoad(() => {
  const info = uni.getStorageSync('userInfo');
  if (info) {
    const u = typeof info === 'string' ? JSON.parse(info) : info;
    avatarUrl.value = u.avatar_url || '';
    // 不预填昵称，让微信type=nickname自动填入
    if (u.nickname && u.nickname !== '用户' && u.nickname !== '测试用户') {
      nickname.value = u.nickname;
    }
  }
});

function onChooseAvatar(e) {
  avatarUrl.value = e.detail.avatarUrl;
}

async function save() {
  saving.value = true;
  try {
    const updates = {};

    // 有头像先用base64上传到后端
    if (avatarUrl.value) {
      try {
        const fs = uni.getFileSystemManager();
        const data = await new Promise((resolve, reject) => {
          fs.readFile({ filePath: avatarUrl.value, success: r => resolve(r.data), fail: reject });
        });
        const base64 = uni.arrayBufferToBase64(data);
        const res = await request.post('/auth/avatar', { data_base64: base64 });
        if (res.code === 0) updates.avatar_url = res.data.avatar_url;
      } catch(e) {
        console.error('头像上传失败:', e);
        uni.showToast({ title: '头像上传失败', icon: 'none' });
      }
    }

    if (nickname.value) updates.nickname = nickname.value;

    if (Object.keys(updates).length > 0) {
      await request.put('/auth/profile', updates);
    }

    // 更新storage
    const info = uni.getStorageSync('userInfo');
    const u = typeof info === 'string' ? JSON.parse(info) : (info || {});
    Object.assign(u, updates);
    uni.setStorageSync('userInfo', JSON.stringify(u));
    userStore.init();
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch(e) {
    console.error('保存失败:', e);
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
  saving.value = false;
}
</script>

<style scoped>
.page { padding: 60rpx 40rpx; display: flex; flex-direction: column; align-items: center; }
.avatar-picker { background: none; border: none; padding: 0; margin: 0 0 16rpx; line-height: 1; }
.avatar-picker::after { border: none; }
.avatar-img, .avatar-empty {
  width: 160rpx; height: 160rpx; border-radius: 50%;
}
.avatar-img { display: block; object-fit: cover; }
.avatar-empty { background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 64rpx; color: #ccc; }
.avatar-tip { font-size: 26rpx; color: #999; margin-bottom: 60rpx; }

.field { width: 100%; display: flex; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #eee; margin-bottom: 60rpx; }
.label { font-size: 30rpx; color: #333; width: 100rpx; }
.input { flex: 1; font-size: 30rpx; height: 50rpx; line-height: 50rpx; }

.btn-save { width: 100%; height: 90rpx; line-height: 90rpx; background: #1890ff; color: #fff; border-radius: 16rpx; font-size: 32rpx; border: none; }
</style>
