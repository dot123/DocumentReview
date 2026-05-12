<template>
  <view class="page" v-if="loading">
    <view class="empty">加载中...</view>
  </view>
  <view class="page" v-else-if="error">
    <view class="empty">{{ error }}</view>
    <button @click="loadReport">重试</button>
  </view>
  <view class="page" v-else-if="report">
    <!-- 报告标题 -->
    <view class="report-header">
      <view class="report-title">文书审核报告</view>
      <view class="report-time">生成时间：{{ report.generatedAt }}</view>
    </view>

    <!-- 文件信息 -->
    <view class="card">
      <view class="card-title">一、文件信息</view>
      <view class="info-row">
        <text class="label">文件名称：</text>
        <text>{{ report.fileInfo.name }}</text>
      </view>
      <view class="info-row">
        <text class="label">文件类型：</text>
        <text>{{ report.fileInfo.type }}</text>
      </view>
      <view class="info-row">
        <text class="label">文件大小：</text>
        <text>{{ report.fileInfo.size }}</text>
      </view>
      <view class="info-row">
        <text class="label">审核耗时：</text>
        <text>{{ report.fileInfo.duration }}秒</text>
      </view>
    </view>

    <!-- 风险统计 -->
    <view class="card">
      <view class="card-title">二、风险统计</view>
      <view class="risk-summary">
        <text class="risk-level" :class="'rl-' + riskLevelClass">
          综合风险等级：{{ report.riskLevel }}
        </text>
      </view>
      <view class="stat-grid">
        <view class="stat-item stat-high">
          <text class="stat-num">{{ report.riskSummary.high }}</text>
          <text class="stat-label">高风险</text>
        </view>
        <view class="stat-item stat-medium">
          <text class="stat-num">{{ report.riskSummary.medium }}</text>
          <text class="stat-label">中风险</text>
        </view>
        <view class="stat-item stat-low">
          <text class="stat-num">{{ report.riskSummary.low }}</text>
          <text class="stat-label">低风险</text>
        </view>
      </view>
    </view>

    <!-- 风险详情 -->
    <view class="card" v-for="(items, level) in report.details" :key="level" v-if="items && items.length">
      <view class="card-title">
        三-{{ levelMap[level] }}、{{ levelLabel[level] }}
      </view>
      <view class="risk-item" v-for="(item, idx) in items" :key="idx">
        <text class="item-name">{{ idx + 1 }}. [{{ item.category }}] {{ item.rule_name }}</text>
        <text class="item-desc">问题：{{ item.description }}</text>
        <text class="item-suggest">建议：{{ item.suggestion }}</text>
        <text class="item-ai-suggest" v-if="item.ai_suggestion">AI建议：{{ item.ai_suggestion }}</text>
      </view>
    </view>

    <!-- AI智能分析 -->
    <view class="card" v-if="report.aiSummary">
      <view class="card-title" style="color:#722ed1">四、AI 智能分析</view>
      <text class="ai-summary-text">{{ report.aiSummary }}</text>
    </view>

    <!-- 声明 -->
    <view class="disclaimer">
      声明：本报告由文书审核系统自动生成，审核结果仅供参考，不构成法律意见。
    </view>

    <!-- 操作 -->
    <view class="bottom-actions">
      <button class="btn-export" @click="doExport">导出PDF</button>
      <button class="btn-print" @click="doPrint">打印报告</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import reportApi from '../../api/report';
import { API_HOST } from '../../config';

const recordId = ref('');
const report = ref(null);
const loading = ref(true);
const error = ref('');

const levelMap = { high: 'A', medium: 'B', low: 'C' };
const levelLabel = { high: '高风险项', medium: '中风险项', low: '低风险项' };
const riskLevelClass = computed(() => {
  const map = { '高风险': 'high', '中风险': 'medium', '低风险': 'low', '无风险': 'none' };
  return map[report.value?.riskLevel] || 'low';
});

onLoad((options) => {
  recordId.value = options.recordId;
  loadReport();
});

async function loadReport() {
  loading.value = true;
  error.value = '';
  try {
    const res = await reportApi.getReport(recordId.value);
    report.value = res.data;
  } catch (err) {
    error.value = '加载报告失败';
    console.error('报告加载失败:', err);
  }
  loading.value = false;
}

async function doExport() {
  try {
    uni.showLoading({ title: '导出中...' });
    const token = uni.getStorageSync('token');
    const res = await uni.downloadFile({
      url: `${API_HOST}/api/report/${recordId.value}/export`,
      header: { Authorization: `Bearer ${token}` },
    });
    uni.hideLoading();
    if (res.statusCode === 200 && res.tempFilePath) {
      await uni.openDocument({ filePath: res.tempFilePath, fileType: 'pdf' });
    } else {
      uni.showToast({ title: '导出失败', icon: 'none' });
    }
  } catch (_) {
    uni.hideLoading();
  }
}

function doPrint() {
  // 小程序内暂不支持直接打印，可导出PDF后打印
  uni.showToast({ title: '请导出PDF后打印', icon: 'none' });
}
</script>

<style scoped>
.page { padding: 30rpx; }
.report-header { text-align: center; margin: 20rpx 0 30rpx; }
.report-title { font-size: 38rpx; font-weight: bold; }
.report-time { font-size: 24rpx; color: #999; margin-top: 8rpx; }

.card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.info-row { font-size: 28rpx; margin-bottom: 8rpx; }
.label { color: #999; }
.risk-summary { margin-bottom: 16rpx; }
.risk-level { font-size: 28rpx; font-weight: bold; }
.rl-high { color: #ff4d4f; }
.rl-medium { color: #faad14; }
.rl-low { color: #52c41a; }
.rl-none { color: #52c41a; }

.stat-grid { display: flex; gap: 20rpx; }
.stat-item { flex: 1; text-align: center; padding: 20rpx; border-radius: 12rpx; }
.stat-high { background: #fff1f0; }
.stat-medium { background: #fffbe6; }
.stat-low { background: #f6ffed; }
.stat-num { font-size: 40rpx; font-weight: bold; display: block; }
.stat-high .stat-num { color: #ff4d4f; }
.stat-medium .stat-num { color: #faad14; }
.stat-low .stat-num { color: #52c41a; }
.stat-label { font-size: 24rpx; color: #666; }

.risk-item { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.item-name { font-size: 28rpx; font-weight: bold; display: block; }
.item-desc { font-size: 26rpx; color: #ff4d4f; display: block; margin-top: 6rpx; }
.item-suggest { font-size: 26rpx; color: #1890ff; display: block; margin-top: 6rpx; }
.item-ai-suggest { font-size: 26rpx; color: #722ed1; display: block; margin-top: 4rpx; }

.ai-summary-text { font-size: 26rpx; color: #333; line-height: 1.8; }
.empty { text-align: center; padding: 200rpx 40rpx; font-size: 30rpx; color: #999; }
.disclaimer { font-size: 24rpx; color: #999; text-align: center; padding: 30rpx; }
.bottom-actions { display: flex; gap: 20rpx; padding-bottom: 40rpx; }
.btn-export { flex: 1; background: #1890ff; color: #fff; border-radius: 12rpx; }
.btn-print { flex: 1; background: #fff; color: #1890ff; border: 1px solid #1890ff; border-radius: 12rpx; }
</style>
