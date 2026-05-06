<template>
  <view class="page">
    <view class="member-header" :class="'bg-' + level">
      <text class="member-title">当前等级：{{ levelLabel }}</text>
      <text class="member-expire" v-if="expireAt">有效期至：{{ expireAt }}</text>
      <text class="member-expire" v-if="!expireAt">永久有效</text>
    </view>

    <view class="card">
      <view class="card-title">会员特权</view>
      <view class="privilege-list">
        <view class="pri-item">
          <text class="pri-icon">✓</text>
          <view>
            <text class="pri-title">普通用户</text>
            <text class="pri-desc">每日上传5份文件，基础审核</text>
          </view>
        </view>
        <view class="pri-item highlight">
          <text class="pri-icon">✓</text>
          <view>
            <text class="pri-title">VIP会员</text>
            <text class="pri-desc">每日上传50份文件，高级审核，PDF导出</text>
          </view>
        </view>
        <view class="pri-item">
          <text class="pri-icon">✓</text>
          <view>
            <text class="pri-title">SVIP会员</text>
            <text class="pri-desc">无限上传，全功能开放，优先处理</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">如何升级</view>
      <view class="upgrade-ways">
        <view class="way-item">1. 邀请好友使用 → 获得VIP会员</view>
        <view class="way-item">2. 持续使用，自动升级</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();
const level = computed(() => userStore.userInfo?.member_level || 'free');
const expireAt = computed(() => userStore.userInfo?.member_expire_at || null);

const levelLabel = computed(() => {
  const map = { free: '普通用户', vip: 'VIP会员', svip: 'SVIP会员' };
  return map[level.value];
});
</script>

<style scoped>
.page { padding: 30rpx; }
.member-header { padding: 50rpx 30rpx; border-radius: 16rpx; color: #fff; text-align: center; margin-bottom: 20rpx; }
.bg-free { background: linear-gradient(135deg, #999, #666); }
.bg-vip { background: linear-gradient(135deg, #faad14, #d48806); }
.bg-svip { background: linear-gradient(135deg, #ff4d4f, #cf1322); }
.member-title { font-size: 38rpx; font-weight: bold; display: block; }
.member-expire { font-size: 26rpx; margin-top: 10rpx; display: block; opacity: 0.9; }

.card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx; }

.pri-item { display: flex; gap: 16rpx; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.pri-item:last-child { border-bottom: none; }
.pri-item.highlight { background: #fffbe6; margin: 0 -20rpx; padding: 20rpx; border-radius: 12rpx; }
.pri-icon { color: #52c41a; font-size: 28rpx; margin-top: 4rpx; }
.pri-title { font-size: 28rpx; font-weight: bold; display: block; }
.pri-desc { font-size: 24rpx; color: #999; }

.upgrade-ways { }
.way-item { font-size: 28rpx; color: #666; padding: 10rpx 0; }
</style>
