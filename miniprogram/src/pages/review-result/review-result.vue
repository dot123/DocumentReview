<template>
  <view class="page">
    <!-- 待审核 -->
    <view class="pending-area" v-if="status === 'pending'">
      <view class="review-icon">📋</view>
      <view class="review-text">待审核</view>
      <view class="review-desc">文件已上传，点击下方按钮提交审核</view>
      <button class="btn-submit" @click="submitReview">提交审核</button>
    </view>

    <!-- 审核中 -->
    <view class="pending-area" v-if="status === 'processing'">
      <view class="review-icon">⏳</view>
      <view class="review-text">审核处理中...</view>
      <view class="review-desc">正在对文档进行全面审核分析</view>
      <button class="btn-refresh" @click="checkResult">刷新查看结果</button>
    </view>

    <!-- 审核失败 -->
    <view class="failed-area" v-if="status === 'failed'">
      <text>审核失败，请重新提交</text>
      <button @click="reSubmit">重新审核</button>
    </view>

    <!-- 审核完成 -->
    <view class="result-area" v-if="status === 'completed' && summary">
      <!-- 风险总览 -->
      <view class="summary-card">
        <view class="risk-badge" :class="'risk-' + riskLevel">
          {{ riskLabel }}
        </view>
        <view class="risk-counts">
          <view class="count-item high">高风险 {{ summary.high }}项</view>
          <view class="count-item medium">中风险 {{ summary.medium }}项</view>
          <view class="count-item low">低风险 {{ summary.low }}项</view>
        </view>
      </view>

      <!-- 风险详情 -->
      <view class="section-title">风险详情</view>

      <view class="risk-list" v-if="details">
        <!-- 高风险 -->
        <block v-for="(item, idx) in (details.high || [])" :key="'h'+idx">
          <view class="risk-item risk-high">
            <view class="risk-header">
              <text class="risk-badge-sm high">高风险</text>
              <text class="risk-name">{{ item.rule_name }}</text>
            </view>
            <text class="risk-desc">{{ item.description }}</text>
            <text class="risk-suggest">建议：{{ item.suggestion }}</text>
            <view class="risk-context" v-if="item.matches && item.matches[0]">
              匹配：{{ item.matches[0].context }}
            </view>
          </view>
        </block>

        <!-- 中风险 -->
        <block v-for="(item, idx) in (details.medium || [])" :key="'m'+idx">
          <view class="risk-item risk-medium">
            <view class="risk-header">
              <text class="risk-badge-sm medium">中风险</text>
              <text class="risk-name">{{ item.rule_name }}</text>
            </view>
            <text class="risk-desc">{{ item.description }}</text>
            <text class="risk-suggest">建议：{{ item.suggestion }}</text>
          </view>
        </block>

        <!-- 低风险 -->
        <block v-for="(item, idx) in (details.low || [])" :key="'l'+idx">
          <view class="risk-item risk-low">
            <view class="risk-header">
              <text class="risk-badge-sm low">低风险</text>
              <text class="risk-name">{{ item.rule_name }}</text>
            </view>
            <text class="risk-desc">{{ item.description }}</text>
            <text class="risk-suggest">建议：{{ item.suggestion }}</text>
          </view>
        </block>

        <!-- 无风险 -->
        <view class="empty-risk" v-if="status === 'completed' && summary.total === 0">
          <text>暂未发现风险项</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions" v-if="status === 'completed'">
        <button class="btn-report" @click="goReport">查看审核报告</button>
        <button class="btn-export" @click="exportPdf">导出PDF报告</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import reviewApi from '../../api/review';
import reportApi from '../../api/report';
import fileApi from '../../api/file';
import { API_HOST } from '../../config';

const fileId = ref('');
const recordId = ref('');
const status = ref('pending');
const summary = ref({ high: 0, medium: 0, low: 0, total: 0 });
const details = ref({ high: [], medium: [], low: [] });
let pollTimer = null;

onLoad((options) => {
  fileId.value = options.fileId || '';
  recordId.value = options.recordId || '';
  if (recordId.value) {
    checkResult();
  } else if (fileId.value) {
    submitAndPoll();
  }
});

async function submitAndPoll() {
  try {
    await reviewApi.startReview(fileId.value);
    pollTimer = setInterval(() => {
      fetchRecordByFile();
    }, 3000);
    fetchRecordByFile();
  } catch (err) {
    status.value = 'failed';
  }
}

async function fetchRecordByFile() {
  try {
    // 按当前文件查询审核记录
    const res = await reviewApi.getRecords({ page: 1, pageSize: 50 });
    const record = (res.data.list || []).find(r => r.file_id == fileId.value);
    if (!record) return;
    status.value = record.status;
    recordId.value = record.id;

    if (record.status === 'completed') {
      clearInterval(pollTimer);
      const detailRes = await reviewApi.getResult(record.id);
      summary.value = detailRes.data.risk_summary;
      details.value = detailRes.data.results?.details;
    }
    if (record.status === 'failed') {
      clearInterval(pollTimer);
    }
  } catch (_) {}
}

async function checkResult() {
  try {
    const res = await reviewApi.getResult(recordId.value);
    summary.value = res.data.risk_summary;
    details.value = res.data.results?.details;
    status.value = res.data.status;
    fileId.value = res.data.file_id;
  } catch (err) {
    status.value = 'pending';
  }
}

async function submitReview() {
  try {
    uni.showLoading({ title: '解析文件中...' });
    await fileApi.getPreview(fileId.value);
    uni.showLoading({ title: '提交审核...' });
    await reviewApi.startReview(fileId.value);
    uni.hideLoading();
    status.value = 'processing';
    pollTimer = setInterval(() => fetchRecordByFile(), 3000);
    fetchRecordByFile();
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: err?.message || '提交失败', icon: 'none' });
  }
}

function reSubmit() {
  status.value = 'pending';
  submitAndPoll();
}

const riskLevel = computed(() => {
  if (!summary.value) return 'low';
  if (summary.value.high > 0) return 'high';
  if (summary.value.medium > 0) return 'medium';
  return 'low';
});

const riskLabel = computed(() => {
  if (!summary.value) return '';
  const map = { high: '高风险', medium: '中风险', low: '低风险' };
  const count = summary.value[riskLevel.value] || 0;
  return map[riskLevel.value] + ' ' + count + '项';
});

function goReport() {
  uni.navigateTo({ url: `/pages/report/report?recordId=${recordId.value}` });
}

async function exportPdf() {
  try {
    uni.showLoading({ title: '生成PDF中...' });
    const token = uni.getStorageSync('token');
    const url = `${API_HOST}/api/report/${recordId.value}/export`;
    console.log('下载PDF:', url);
    const res = await uni.downloadFile({
      url,
      header: { Authorization: `Bearer ${token}` },
    });
    console.log('下载结果:', res.statusCode, res.tempFilePath);
    uni.hideLoading();
    if (res.statusCode === 200 && res.tempFilePath) {
      await uni.openDocument({ filePath: res.tempFilePath, fileType: 'pdf' });
    } else {
      uni.showToast({ title: '导出失败: ' + (res.statusCode || '未知错误'), icon: 'none' });
    }
  } catch (err) {
    uni.hideLoading();
    console.error('导出错误:', err);
    uni.showToast({ title: '导出失败: ' + (err.errMsg || ''), icon: 'none' });
  }
}
</script>

<style scoped>
.page { padding: 30rpx; }
.pending-area, .failed-area { text-align: center; padding: 120rpx 40rpx; }
.review-icon { font-size: 80rpx; }
.review-text { font-size: 34rpx; font-weight: bold; margin: 20rpx 0 10rpx; }
.review-desc { font-size: 26rpx; color: #999; }
.btn-refresh, .btn-submit { margin-top: 40rpx; background: #1890ff; color: #fff; border-radius: 12rpx; }

.summary-card { background: #fff; border-radius: 16rpx; padding: 30rpx; display: flex; align-items: center; gap: 30rpx; margin-bottom: 20rpx; }
.risk-badge { font-size: 32rpx; font-weight: bold; padding: 16rpx 24rpx; border-radius: 12rpx; color: #fff; }
.risk-badge.risk-high { background: #ff4d4f; }
.risk-badge.risk-medium { background: #faad14; }
.risk-badge.risk-low { background: #52c41a; }
.count-item { font-size: 28rpx; margin-bottom: 8rpx; }
.count-item.high { color: #ff4d4f; }
.count-item.medium { color: #faad14; }
.count-item.low { color: #52c41a; }

.section-title { font-size: 32rpx; font-weight: bold; margin: 20rpx 0; }

.risk-item { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx; border-left: 6rpx solid #ddd; }
.risk-item.risk-high { border-left-color: #ff4d4f; }
.risk-item.risk-medium { border-left-color: #faad14; }
.risk-item.risk-low { border-left-color: #52c41a; }

.risk-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 10rpx; }
.risk-badge-sm { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx; color: #fff; }
.risk-badge-sm.high { background: #ff4d4f; }
.risk-badge-sm.medium { background: #faad14; }
.risk-badge-sm.low { background: #52c41a; }
.risk-name { font-size: 28rpx; font-weight: bold; flex: 1; }
.risk-desc { font-size: 26rpx; color: #666; display: block; margin-bottom: 8rpx; }
.risk-suggest { font-size: 26rpx; color: #1890ff; display: block; }
.risk-context { font-size: 24rpx; color: #999; margin-top: 8rpx; background: #f5f5f5; padding: 10rpx; border-radius: 8rpx; }

.empty-risk { text-align: center; padding: 60rpx; color: #52c41a; font-size: 30rpx; }
.actions { display: flex; gap: 20rpx; margin-top: 40rpx; }
.btn-report { flex: 1; background: #1890ff; color: #fff; border-radius: 12rpx; font-size: 30rpx; }
.btn-export { flex: 1; background: #fff; color: #1890ff; border: 1px solid #1890ff; border-radius: 12rpx; font-size: 30rpx; }
</style>
