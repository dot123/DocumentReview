<template>
  <view class="doc-preview">
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
    <view class="error" v-if="error">
      <text>{{ error }}</text>
      <button @click="$emit('retry')">重试</button>
    </view>
    <view class="content" v-if="content">
      <view class="meta-bar">
        <text class="meta-name">{{ fileName }}</text>
        <text class="meta-tag" v-if="isScanned">扫描版·OCR</text>
      </view>
      <scroll-view class="text-scroll" scroll-y>
        <text class="text-content">{{ content }}</text>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  loading: Boolean,
  error: String,
  content: String,
  fileName: String,
  isScanned: Boolean,
});

defineEmits(['retry']);
</script>

<style scoped>
.doc-preview { background: #fff; border-radius: 16rpx; overflow: hidden; }
.loading, .error { text-align: center; padding: 80rpx 30rpx; }
.meta-bar { display: flex; align-items: center; gap: 12rpx; padding: 16rpx 24rpx; border-bottom: 1rpx solid #f0f0f0; }
.meta-name { font-size: 28rpx; font-weight: bold; flex: 1; }
.meta-tag { font-size: 22rpx; background: #ff9500; color: #fff; padding: 4rpx 10rpx; border-radius: 8rpx; }
.text-scroll { max-height: 80vh; padding: 24rpx; }
.text-content { font-size: 28rpx; line-height: 1.8; white-space: pre-wrap; word-break: break-all; }
</style>
