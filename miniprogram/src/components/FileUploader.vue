<template>
  <view class="file-uploader">
    <view class="drop-zone" :class="{ active: dragging }" @click="chooseFile">
      <slot name="default">
        <view class="upload-icon">+</view>
        <view class="upload-text">点击选择文件</view>
        <view class="upload-desc">支持 .docx / .pdf 格式，最大100MB</view>
      </slot>
    </view>

    <view class="file-list" v-if="files.length > 0">
      <view class="file-item" v-for="(f, idx) in files" :key="idx">
        <view class="file-info">
          <text class="file-name">{{ f.name }}</text>
          <text class="file-size">{{ formatSize(f.size) }}</text>
        </view>
        <view class="file-status">
          <text class="status-text" v-if="f.status === 'uploading'">{{ f.progress }}%</text>
          <text class="status-text success" v-if="f.status === 'done'">✓</text>
          <text class="status-text error" v-if="f.status === 'error'">✗</text>
        </view>
        <view class="progress-bar" v-if="f.status === 'uploading'">
          <view class="progress-fill" :style="{ width: f.progress + '%' }"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  accept: { type: String, default: 'docx,pdf' },
  maxSize: { type: Number, default: 100 * 1024 * 1024 }, // 100MB
});

const emit = defineEmits(['upload', 'complete', 'error']);

const dragging = ref(false);
const files = ref([]);

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0, size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return size.toFixed(1) + ' ' + units[i];
}

function chooseFile() {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: props.accept.split(',').map(e => e.trim()),
    success(res) {
      const f = res.tempFiles[0];
      if (f.size > props.maxSize) {
        uni.showToast({ title: '文件大小超过限制', icon: 'none' });
        return;
      }
      files.value.push({
        name: f.name,
        size: f.size,
        path: f.path,
        status: 'pending',
        progress: 0,
      });
      emit('upload', f);
    },
  });
}
</script>

<style scoped>
.file-uploader { }
.drop-zone {
  border: 3rpx dashed #d9d9d9;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  background: #fafafa;
}
.drop-zone.active { border-color: #1890ff; background: #e6f7ff; }
.upload-icon { font-size: 64rpx; color: #1890ff; }
.upload-text { font-size: 28rpx; color: #333; margin-top: 12rpx; }
.upload-desc { font-size: 24rpx; color: #999; margin-top: 8rpx; }

.file-item { background: #fff; border-radius: 12rpx; padding: 20rpx; margin-top: 16rpx; }
.file-info { display: flex; justify-content: space-between; margin-bottom: 10rpx; }
.file-name { font-size: 28rpx; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { font-size: 24rpx; color: #999; }
.file-status { text-align: right; }
.status-text.success { color: #52c41a; }
.status-text.error { color: #ff4d4f; }
.progress-bar { height: 8rpx; background: #f0f0f0; border-radius: 4rpx; overflow: hidden; margin-top: 10rpx; }
.progress-fill { height: 100%; background: #1890ff; transition: width 0.3s; }
</style>
