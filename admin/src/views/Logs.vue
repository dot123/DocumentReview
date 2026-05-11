<template>
  <div>
    <h3>操作日志</h3>

    <el-form :inline="true" :model="filter" style="margin-bottom:16px">
      <el-form-item label="操作类型">
        <el-select v-model="filter.action" placeholder="全部" clearable>
          <el-option label="登录" value="login" />
          <el-option label="上传文件" value="upload_file" />
          <el-option label="开始审核" value="start_review" />
          <el-option label="创建规则" value="create_rule" />
          <el-option label="更新规则" value="update_rule" />
          <el-option label="删除规则" value="delete_rule" />
          <el-option label="用户管理" value="update_user" />
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
        <template #default="{ row }">{{ row.User?.nickname || '系统' }}</template>
      </el-table-column>
      <el-table-column label="操作类型" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ actionMap[row.action] || row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target_type" label="对象类型" width="100" />
      <el-table-column prop="target_id" label="对象ID" width="80" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="created_at" label="时间" width="180" :formatter="(r,c) => $date(r.created_at)" />
      <el-table-column label="详情" min-width="200">
        <template #default="{ row }">
          <template v-if="row.detail">
            {{ parseDetail(row.detail) }}
          </template>
          <span v-else style="color:#ccc">-</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../api';

const list = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const filter = reactive({ action: '' });
const dateRange = ref([]);

const actionMap = {
  login: '登录', upload_file: '上传文件', delete_file: '删除文件',
  start_review: '开始审核', create_rule: '创建规则', update_rule: '更新规则',
  delete_rule: '删除规则', update_user: '更新用户', bind_phone: '绑定手机',
};

function parseDetail(detail) {
  try {
    const obj = typeof detail === 'string' ? JSON.parse(detail) : detail;
    return obj.description || detail;
  } catch {
    return detail;
  }
}

onMounted(() => loadList());

async function loadList() {
  loading.value = true;
  try {
    const params = { ...filter, page: page.value, pageSize: pageSize.value };
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const res = await api.getLogs(params);
    list.value = res.data.list;
    total.value = res.data.total;
  } catch (_) {}
  loading.value = false;
}
</script>
