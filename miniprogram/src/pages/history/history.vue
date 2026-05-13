<template>
  <view class="page">
    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无审核记录</text>
      <button class="btn-upload" @click="goUpload">上传文件开始审核</button>
    </view>

    <view class="list" v-for="item in list" :key="item.id" @click="goResult(item)">
      <view class="record-card">
        <view class="record-header">
          <text class="record-name">{{ item.file?.original_name || '未知文件' }}</text>
          <text class="record-status" :class="'status-' + item.status">
            {{ statusMap[item.status] || item.status }}
          </text>
        </view>
        <view class="record-meta" v-if="item.status === 'completed' && item.risk_summary">
          <text class="meta-risk high" v-if="item.risk_summary.high">高风险{{ item.risk_summary.high }}</text>
          <text class="meta-risk medium" v-if="item.risk_summary.medium">中风险{{ item.risk_summary.medium }}</text>
          <text class="meta-risk low" v-if="item.risk_summary.low">低风险{{ item.risk_summary.low }}</text>
          <text class="meta-risk safe" v-if="item.risk_summary.total === 0">无风险</text>
        </view>
        <view class="record-time">{{ formatDate(item.created_at) }}</view>
      </view>
    </view>

    <view class="load-more" v-if="hasMore" @click="loadMore">加载更多</view>
    <view class="no-more" v-if="!hasMore && list.length > 0">已加载全部记录</view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import reviewApi from '../../api/review';
import { formatDate } from '../../utils/auth';

const list = ref([]);
const page = ref(1);
const hasMore = ref(true);
const loading = ref(true);
const statusMap = {
  pending: '待审核',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

onShow(() => {
  page.value = 1;
  list.value = [];
  loading.value = true;
  loadList();
});

async function loadList() {
  try {
    const res = await reviewApi.getRecords({ page: page.value, pageSize: 20 });
    list.value = page.value === 1 ? res.data.list : [...list.value, ...res.data.list];
    hasMore.value = list.value.length < res.data.total;
  } catch (_) {}
  loading.value = false;
}

function loadMore() {
  page.value++;
  loadList();
}

function goUpload() {
  uni.navigateTo({ url: '/pages/upload/upload' });
}

function goResult(item) {
  if (item.status === 'completed') {
    uni.navigateTo({ url: `/pages/review-result/review-result?recordId=${item.id}` });
  } else if (item.status === 'pending' || item.status === 'processing') {
    uni.navigateTo({ url: `/pages/review-result/review-result?recordId=${item.id}` });
  }
}
</script>

<style scoped>
.page { padding: 30rpx; }
.empty { text-align: center; padding: 200rpx 40rpx; }
.empty-text { font-size: 30rpx; color: #999; display: block; }
.btn-upload { margin-top: 30rpx; background: #1890ff; color: #fff; border-radius: 12rpx; }

.record-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.record-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.record-name { font-size: 30rpx; font-weight: bold; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-status { font-size: 24rpx; padding: 4rpx 14rpx; border-radius: 20rpx; }
.status-pending { background: #f5f5f5; color: #999; }
.status-processing { background: #e6f7ff; color: #1890ff; }
.status-completed { background: #f6ffed; color: #52c41a; }
.status-failed { background: #fff1f0; color: #ff4d4f; }

.record-meta { display: flex; gap: 16rpx; }
.meta-risk { font-size: 24rpx; padding: 2rpx 10rpx; border-radius: 8rpx; }
.meta-risk.high { background: #fff1f0; color: #ff4d4f; }
.meta-risk.medium { background: #fffbe6; color: #faad14; }
.meta-risk.low { background: #f6ffed; color: #52c41a; }
.meta-risk.safe { background: #f6ffed; color: #52c41a; }
.record-time { font-size: 24rpx; color: #999; margin-top: 8rpx; }

.load-more, .no-more { text-align: center; font-size: 26rpx; padding: 20rpx; }
.load-more { color: #1890ff; }
.no-more { color: #ccc; }
</style>
