<template>
  <view class="page">
    <view class="loading-area" v-if="loading">
      <view class="loading-text">文档解析中...</view>
      <view class="loading-desc">正在提取文档内容，请稍候</view>
    </view>

    <view class="error-area" v-if="error">
      <text>解析失败：{{ error }}</text>
      <button @click="loadPreview">重新加载</button>
    </view>

    <view class="content" v-if="!loading && !error">
      <view class="file-meta">
        <text class="meta-name">{{ originalName }}</text>
        <text class="meta-tag" v-if="isScanned">扫描版</text>
      </view>
      <view class="text-content">
        <text>{{ textContent }}</text>
      </view>
    </view>

    <view class="bottom-bar" v-if="!loading && !error">
      <button class="btn-review" @click="goReview">提交审核</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import fileApi from '../../api/file';

const fileId = ref('');
const loading = ref(true);
const error = ref('');
const textContent = ref('');
const originalName = ref('');
const isScanned = ref(false);

onLoad((options) => {
  fileId.value = options.id;
  loadPreview();
});

async function loadPreview() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fileApi.getPreview(fileId.value);
    textContent.value = res.data.text;
    originalName.value = res.data.original_name;
    isScanned.value = res.data.is_scanned;
  } catch (err) {
    error.value = err.message || '解析失败';
  }
  loading.value = false;
}

function goReview() {
  uni.redirectTo({ url: `/pages/review-result/review-result?fileId=${fileId.value}` });
}
</script>

<style scoped>
.page { padding: 0; min-height: 100vh; background: #fff; }
.loading-area, .error-area { text-align: center; padding: 200rpx 40rpx; }
.loading-text { font-size: 32rpx; color: #333; }
.loading-desc { font-size: 26rpx; color: #999; margin-top: 10rpx; }
.file-meta { padding: 20rpx 30rpx; border-bottom: 1rpx solid #f0f0f0; display: flex; align-items: center; gap: 16rpx; }
.meta-name { font-size: 30rpx; font-weight: bold; }
.meta-tag { background: #ff9500; color: #fff; font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.text-content { padding: 30rpx; font-size: 28rpx; line-height: 1.8; white-space: pre-wrap; word-break: break-all; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 30rpx; background: #fff; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.05); }
.btn-review { background: #1890ff; color: #fff; border-radius: 12rpx; font-size: 32rpx; }
</style>
