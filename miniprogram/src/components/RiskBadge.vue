<template>
  <view class="risk-badge" :class="'risk-' + level">
    <text class="badge-text">{{ label }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  level: { type: String, default: 'medium' }, // high, medium, low
  count: { type: Number, default: 0 },
});

const label = computed(() => {
  const map = { high: '高风险', medium: '中风险', low: '低风险' };
  return map[props.level] + (props.count > 0 ? ` (${props.count})` : '');
});
</script>

<style scoped>
.risk-badge { display: inline-block; padding: 4rpx 14rpx; border-radius: 20rpx; }
.risk-high { background: #fff1f0; }
.risk-high .badge-text { color: #ff4d4f; }
.risk-medium { background: #fffbe6; }
.risk-medium .badge-text { color: #faad14; }
.risk-low { background: #f6ffed; }
.risk-low .badge-text { color: #52c41a; }
.badge-text { font-size: 24rpx; }
</style>
