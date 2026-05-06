<template>
  <view class="review-chart">
    <view class="chart-title" v-if="title">{{ title }}</view>

    <!-- 风险分布条 -->
    <view class="risk-bar" v-if="summary">
      <view class="bar-segment bar-high" :style="{ flex: summary.high || 0 }" v-if="summary.high">
        <text>{{ summary.high }}</text>
      </view>
      <view class="bar-segment bar-medium" :style="{ flex: summary.medium || 0 }" v-if="summary.medium">
        <text>{{ summary.medium }}</text>
      </view>
      <view class="bar-segment bar-low" :style="{ flex: summary.low || 0 }" v-if="summary.low">
        <text>{{ summary.low }}</text>
      </view>
      <view class="bar-empty" v-if="summary.total === 0">
        <text>无风险</text>
      </view>
    </view>

    <!-- 图例 -->
    <view class="legend">
      <view class="legend-item">
        <view class="dot dot-high"></view>
        <text>高风险</text>
      </view>
      <view class="legend-item">
        <view class="dot dot-medium"></view>
        <text>中风险</text>
      </view>
      <view class="legend-item">
        <view class="dot dot-low"></view>
        <text>低风险</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  summary: { type: Object, default: null },
});
</script>

<style scoped>
.review-chart { padding: 20rpx 0; }
.chart-title { font-size: 28rpx; font-weight: bold; margin-bottom: 16rpx; }
.risk-bar { display: flex; height: 40rpx; border-radius: 10rpx; overflow: hidden; min-width: 100%; }
.bar-segment { display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22rpx; min-width: 60rpx; }
.bar-high { background: #ff4d4f; }
.bar-medium { background: #faad14; }
.bar-low { background: #52c41a; }
.bar-empty { flex: 1; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; font-size: 22rpx; }
.legend { display: flex; gap: 30rpx; margin-top: 16rpx; }
.legend-item { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #666; }
.dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.dot-high { background: #ff4d4f; }
.dot-medium { background: #faad14; }
.dot-low { background: #52c41a; }
</style>
