<template>
  <view class="page">
    <!-- 上传区域 - 使用按钮确保点击可靠 -->
    <view class="upload-area" v-if="!file">
      <button class="btn-pick-file" @click="chooseFile">
        <text class="pick-icon">+</text>
        <text class="pick-title">选择文件</text>
        <text class="pick-desc">从微信聊天记录中选择 Word / PDF</text>
        <text class="pick-note" v-if="quota">今日还可上传 {{ quota.remaining }} 次（{{ quota.member_level === 'free' ? '普通用户' : quota.member_level === 'vip' ? 'VIP' : 'SVIP' }}每日{{ quota.daily_limit }}次）</text>
      </button>
    </view>

    <!-- 文件信息 -->
    <view class="file-info" v-if="file">
      <view class="file-name">{{ file.name }}</view>
      <view class="file-size">{{ formatSize(file.size) }}</view>

      <view class="progress-area" v-if="uploading">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <text class="progress-text">{{ progress }}%</text>
      </view>

      <view class="upload-success" v-if="uploaded">
        <text class="success-icon">✓</text>
        <text>上传成功</text>
        <view class="btn-row">
          <button class="btn-preview" @click="goPreview">预览文件</button>
          <button class="btn-review" @click="startReview">开始审核</button>
        </view>
      </view>

      <view class="btn-group" v-if="!uploading && !uploaded">
        <button class="btn-upload" @click="doUpload">开始上传</button>
        <button class="btn-reset" @click="reset">重新选择</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import request from '../../utils/request';
import fileApi from '../../api/file';
import reviewApi from '../../api/review';
import { API_HOST } from '../../config';

const file = ref(null);
const uploading = ref(false);
const progress = ref(0);
const uploaded = ref(false);
const fileId = ref(null);

const CHUNK_SIZE = 2 * 1024 * 1024;
const quota = ref(null);

// 加载限额
function loadQuota() {
  request.get('/files/quota').then(r => { if (r.code === 0) quota.value = r.data; }).catch(() => {});
}
loadQuota();

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, s = bytes;
  while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
  return s.toFixed(1) + ' ' + u[i];
}

function chooseFile() {
  console.log('>>> 调用 chooseMessageFile');
  uni.chooseMessageFile({
    count: 1,
    type: 'all',
    success(res) {
      console.log('<<< 文件选择成功:', JSON.stringify(res.tempFiles[0]));
      const f = res.tempFiles[0];
      const name = f.name.toLowerCase();
      if (!name.endsWith('.docx') && !name.endsWith('.doc') && !name.endsWith('.pdf')) {
        uni.showToast({ title: '仅支持 Word(.docx) 和 PDF 文件', icon: 'none' });
        return;
      }
      file.value = {
        name: f.name,
        size: f.size,
        path: f.path,
        type: name.endsWith('.pdf') ? 'pdf' : 'docx',
      };
      uploaded.value = false;
      progress.value = 0;
    },
    fail(err) {
      console.error('文件选择失败:', err);
      uni.showToast({ title: '选择文件失败', icon: 'none' });
    },
  });
}

async function doUpload() {
  if (!file.value) return;
  uploading.value = true;
  progress.value = 10;
  try {
    const f = file.value;
    const fs = uni.getFileSystemManager();

    // 读取整个文件
    const data = await new Promise((resolve, reject) => {
      fs.readFile({ filePath: f.path, success: r => resolve(r.data), fail: reject });
    });

    progress.value = 50;

    // 一次性上传base64
    const base64 = uni.arrayBufferToBase64(data);
    const res = await request.post('/files/upload/direct', {
      original_name: f.name,
      file_type: f.type,
      file_size: f.size,
      data_base64: base64,
    });

    progress.value = 100;
    fileId.value = res.data.id;
    uploaded.value = true;
    console.log('<<< 上传完成, fileId:', fileId.value);
  } catch (err) {
    console.error('上传失败:', err);
    uni.showToast({ title: err?.message || '上传失败', icon: 'none' });
  }
  uploading.value = false;
}

function reset() { file.value = null; uploaded.value = false; progress.value = 0; }
function goPreview() { uni.navigateTo({ url: `/pages/preview/preview?id=${fileId.value}` }); }

async function startReview() {
  try {
    await fileApi.getPreview(fileId.value);
    uni.showLoading({ title: '提交审核...' });
    await reviewApi.startReview(fileId.value);
    uni.hideLoading();
    uni.switchTab({ url: '/pages/history/history' });
  } catch (err) {
    uni.hideLoading();
    console.error('提交审核失败:', err);
    uni.showToast({ title: '提交审核失败', icon: 'none' });
  }
}
</script>

<style scoped>
.page { padding: 30rpx; min-height: 100vh; }

.upload-area { margin-bottom: 30rpx; }
.btn-pick-file {
  width: 100%; height: auto; background: #fff;
  border: 3rpx dashed #1890ff; border-radius: 16rpx;
  padding: 60rpx 30rpx; text-align: center;
  display: flex; flex-direction: column; align-items: center;
  line-height: normal;
}
.btn-pick-file::after { border: none; }
.pick-icon { font-size: 80rpx; color: #1890ff; font-weight: 200; }
.pick-title { font-size: 32rpx; font-weight: bold; margin-top: 16rpx; }
.pick-desc { font-size: 26rpx; color: #666; margin-top: 8rpx; }
.pick-note { font-size: 22rpx; color: #999; margin-top: 16rpx; }

.file-info { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.file-name { font-size: 30rpx; font-weight: bold; word-break: break-all; }
.file-size { font-size: 26rpx; color: #999; margin-top: 10rpx; }

.progress-area { margin-top: 30rpx; text-align: center; }
.progress-bar { height: 12rpx; background: #f0f0f0; border-radius: 6rpx; overflow: hidden; margin-bottom: 16rpx; }
.progress-fill { height: 100%; background: #1890ff; transition: width 0.3s; }
.progress-text { font-size: 36rpx; font-weight: bold; color: #1890ff; }

.upload-success { text-align: center; margin-top: 30rpx; }
.success-icon { font-size: 60rpx; color: #52c41a; display: block; margin-bottom: 10rpx; }

.btn-group { display: flex; gap: 20rpx; margin-top: 30rpx; }
.btn-upload, .btn-preview { flex: 1; background: #1890ff; color: #fff; border-radius: 12rpx; font-size: 30rpx; }
.btn-reset { flex: 1; background: #f5f5f5; color: #666; border-radius: 12rpx; font-size: 30rpx; }
.btn-review { flex: 1; background: #52c41a; color: #fff; border-radius: 12rpx; font-size: 30rpx; }
.btn-row { display: flex; gap: 20rpx; margin-top: 20rpx; }
</style>
