<template>
  <view class="page">
    <view class="card">
      <view class="card-title">邀请好友</view>
      <view class="card-desc">邀请好友使用文书审核，双方均可获得VIP会员体验</view>
      <view class="invite-code">{{ inviteCode }}</view>
      <button class="btn-share" open-type="share">分享给好友</button>
    </view>

    <view class="card">
      <view class="card-title">邀请记录</view>
      <view class="invite-count">累计邀请 {{ inviteCount }} 人</view>
      <view class="invite-list" v-if="invitees.length > 0">
        <view class="invite-item" v-for="item in invitees" :key="item.id">
          <text class="invitee-name">{{ item.invitee?.nickname || '用户' }}</text>
          <text class="invitee-time">{{ formatDate(item.created_at) }}</text>
        </view>
      </view>
      <view class="empty-invite" v-if="invitees.length === 0">
        暂无邀请记录
      </view>
    </view>

    <view class="card">
      <view class="card-title">推广规则</view>
      <view class="rule-item">1. 分享邀请链接给好友</view>
      <view class="rule-item">2. 好友首次登录即绑定邀请关系</view>
      <view class="rule-item">3. 每邀请1人，邀请人获得30天VIP会员</view>
      <view class="rule-item">4. 被邀请人获得7天VIP体验</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import userApi from '../../api/user';
import { formatDate } from '../../utils/auth';

const inviteCode = ref('');
const inviteCount = ref(0);
const invitees = ref([]);

onShow(async () => {
  try {
    const codeRes = await userApi.getInviteCode();
    inviteCode.value = codeRes.data.invite_code;

    const statsRes = await userApi.getInviteStats();
    inviteCount.value = statsRes.data.invite_count;
    invitees.value = statsRes.data.invitees || [];
  } catch (_) {}
});
</script>

<style scoped>
.page { padding: 30rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 32rpx; font-weight: bold; margin-bottom: 10rpx; }
.card-desc { font-size: 26rpx; color: #666; margin-bottom: 20rpx; }
.invite-code { font-size: 36rpx; font-weight: bold; color: #1890ff; text-align: center; padding: 20rpx; background: #f0f5ff; border-radius: 12rpx; margin-bottom: 20rpx; letter-spacing: 4rpx; }
.btn-share { background: #07c160; color: #fff; border-radius: 12rpx; font-size: 30rpx; }

.invite-count { font-size: 28rpx; color: #1890ff; margin-bottom: 16rpx; }
.invite-item { display: flex; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; font-size: 28rpx; }
.invitee-time { color: #999; font-size: 24rpx; }
.empty-invite { text-align: center; color: #999; padding: 30rpx; }
.rule-item { font-size: 26rpx; color: #666; padding: 8rpx 0; }
</style>
