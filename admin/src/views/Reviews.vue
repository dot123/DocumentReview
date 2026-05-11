<template>
  <div>
    <h3>审核记录</h3>

    <el-form :inline="true" :model="filter" style="margin-bottom:16px">
      <el-form-item label="状态">
        <el-select v-model="filter.status" placeholder="全部" clearable>
          <el-option label="待审核" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
          start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadList">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户" width="120">
        <template #default="{ row }">{{ row.user?.nickname || '-' }}</template>
      </el-table-column>
      <el-table-column label="文件" min-width="200">
        <template #default="{ row }">{{ row.file?.original_name || '-' }}</template>
      </el-table-column>
      <el-table-column label="文件类型" width="80">
        <template #default="{ row }">{{ row.file?.file_type || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="风险统计" width="160">
        <template #default="{ row }">
          <template v-if="row.risk_summary">
            <el-tag type="danger" size="small" v-if="row.risk_summary.high">高{{ row.risk_summary.high }}</el-tag>
            <el-tag type="warning" size="small" v-if="row.risk_summary.medium">中{{ row.risk_summary.medium }}</el-tag>
            <el-tag type="success" size="small" v-if="row.risk_summary.low">低{{ row.risk_summary.low }}</el-tag>
            <span v-if="row.risk_summary.total === 0" style="color:#67C23A">无风险</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="耗时" width="70">
        <template #default="{ row }">{{ row.duration }}s</template>
      </el-table-column>
      <el-table-column prop="created_at" label="时间" width="180" :formatter="(r,c) => $date(r.created_at)" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" @click="showDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;justify-content:flex-end"
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadList"
    />

    <!-- 审核详情弹窗 -->
    <el-dialog v-model="detailVisible" title="审核详情" width="800px">
      <div v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户">{{ detail.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="文件">{{ detail.file?.original_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusMap[detail.status] }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ detail.duration }}秒</el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.results?.details" style="margin-top:16px">
          <template v-for="level in ['high', 'medium', 'low']" :key="level">
            <template v-if="detail.results.details[level]?.length">
              <el-divider>{{ levelLabel[level] }} ({{ detail.results.details[level].length }}项)</el-divider>
              <div v-for="(item, idx) in detail.results.details[level]" :key="idx" style="margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px">
                <strong>{{ item.rule_name }}</strong>
                <p style="margin:4px 0;color:#666">{{ item.description }}</p>
                <p style="margin:4px 0;color:#409EFF">建议：{{ item.suggestion }}</p>
              </div>
            </template>
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../api';

const list = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filter = reactive({ status: '' });
const dateRange = ref([]);

const detailVisible = ref(false);
const detail = ref(null);

const statusMap = { pending: '待审核', processing: '处理中', completed: '已完成', failed: '失败' };
const statusTag = { pending: 'info', processing: 'warning', completed: 'success', failed: 'danger' };
const levelLabel = { high: '高风险', medium: '中风险', low: '低风险' };

onMounted(() => loadList());

async function loadList() {
  loading.value = true;
  try {
    const params = { ...filter, page: page.value, pageSize: pageSize.value };
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const res = await api.getReviews(params);
    list.value = res.data.list;
    total.value = res.data.total;
  } catch (_) {}
  loading.value = false;
}

async function showDetail(row) {
  try {
    const res = await api.getReviewDetail(row.id);
    detail.value = res.data;
    detailVisible.value = true;
  } catch (_) {}
}
</script>
