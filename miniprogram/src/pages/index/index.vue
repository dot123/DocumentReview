<template>
  <view class="page">
    <!-- 头部 -->
    <view class="header">
      <view class="header-title">文书审核助手</view>
      <view class="header-desc">智能审核·风险检测·报告导出</view>
    </view>

    <!-- 功能入口 -->
    <view class="actions">
      <view class="action-card" @click="goUpload">
        <view class="action-icon">+</view>
        <view class="action-title">上传文件</view>
        <view class="action-desc">支持Word / PDF</view>
      </view>
      <view class="action-card" @click="goHistory">
        <view class="action-icon">📋</view>
        <view class="action-title">审核记录</view>
        <view class="action-desc">查看历史审核</view>
      </view>
    </view>

    <!-- 支持的文件格式 -->
    <view class="section">
      <view class="section-title">支持的文件格式</view>
      <view class="format-list">
        <view class="format-item">
          <view class="format-icon icon-docx">W</view>
          <text>.docx Word文档</text>
        </view>
        <view class="format-item">
          <view class="format-icon icon-pdf">P</view>
          <text>.pdf PDF文件</text>
        </view>
      </view>
    </view>

    <!-- 审核能力 -->
    <view class="section">
      <view class="section-title">审核能力</view>
      <view class="feature-list">
        <view class="feature-item">
          <text class="feature-dot"></text>
          <text>AI智能风险分析</text>
        </view>
        <view class="feature-item">
          <text class="feature-dot"></text>
          <text>条款完整性校验</text>
        </view>
        <view class="feature-item">
          <text class="feature-dot"></text>
          <text>漏洞与缺失检测</text>
        </view>
        <view class="feature-item">
          <text class="feature-dot"></text>
          <text>11项风险维度覆盖</text>
        </view>
        <view class="feature-item">
          <text class="feature-dot"></text>
          <text>审核报告一键导出</text>
        </view>
      </view>
    </view>

    <!-- 隐私声明 -->
    <view class="privacy-tip" @click="goPrivacy">
      上传的文件仅用于本次审核，加密存储 · 隐私协议
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';

onShow(() => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.reLaunch({ url: '/pages/login/login' });
  }
});

function goUpload() {
  uni.navigateTo({ url: '/pages/upload/upload' });
}
function goHistory() {
  uni.switchTab({ url: '/pages/history/history' });
}
function goPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/privacy' });
}
</script>

<style scoped>
.page { padding: 20rpx 30rpx; }
.header {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  padding: 40rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}
.header-title { font-size: 40rpx; font-weight: bold; }
.header-desc { font-size: 26rpx; opacity: 0.9; margin-top: 10rpx; }

.actions { display: flex; gap: 20rpx; margin-bottom: 30rpx; }
.action-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.action-icon { font-size: 48rpx; }
.action-title { font-size: 30rpx; font-weight: bold; margin: 10rpx 0 6rpx; }
.action-desc { font-size: 24rpx; color: #999; }

.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 20rpx; }

.format-list { display: flex; gap: 30rpx; }
.format-item { display: flex; align-items: center; gap: 12rpx; font-size: 28rpx; }
.format-icon { width: 60rpx; height: 60rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: bold; color: #fff; }
.icon-docx { background: #1890ff; }
.icon-pdf { background: #ff4d4f; }

.feature-item { display: flex; align-items: center; gap: 12rpx; font-size: 28rpx; padding: 12rpx 0; }
.feature-dot { width: 12rpx; height: 12rpx; background: #1890ff; border-radius: 50%; flex-shrink: 0; }

.privacy-tip { text-align: center; font-size: 24rpx; color: #999; padding: 30rpx; }
</style>
