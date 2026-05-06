<template>
  <div>
    <h3>用户管理</h3>

    <el-form :inline="true" :model="filter" style="margin-bottom:16px">
      <el-form-item label="角色">
        <el-select v-model="filter.role" placeholder="全部" clearable>
          <el-option label="普通用户" value="user" />
          <el-option label="管理员" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filter.status" placeholder="全部" clearable>
          <el-option label="正常" value="active" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadList">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column label="角色" width="80">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">{{ row.role === 'admin' ? '管理员' : '用户' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="会员" width="100">
        <template #default="{ row }">
          <el-tag :type="memberTag[row.member_level]" size="small">{{ memberLabel[row.member_level] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">{{ row.status === 'active' ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="180" :formatter="(r,c) => $date(r.created_at)" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="showDetail(row)">详情</el-button>
          <el-button v-if="row.status === 'active'" size="small" type="danger" @click="disableUser(row)">禁用</el-button>
          <el-button v-else size="small" type="success" @click="enableUser(row)">启用</el-button>
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

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="500px">
      <el-descriptions :column="1" border v-if="detail">
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detail.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.phone || '未绑定' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ detail.role === 'admin' ? '管理员' : '普通用户' }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">{{ memberLabel[detail.member_level] }}</el-descriptions-item>
        <el-descriptions-item label="上传文件数">{{ detail.file_count }}</el-descriptions-item>
        <el-descriptions-item label="审核次数">{{ detail.review_count }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ $date(detail.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../api';

const list = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filter = reactive({ role: '', status: '' });

const detailVisible = ref(false);
const detail = ref(null);

const memberLabel = { free: '普通用户', vip: 'VIP', svip: 'SVIP' };
const memberTag = { free: 'info', vip: 'warning', svip: 'danger' };

onMounted(() => loadList());

async function loadList() {
  loading.value = true;
  try {
    const res = await api.getUsers({ ...filter, page: page.value, pageSize: pageSize.value });
    list.value = res.data.list;
    total.value = res.data.total;
  } catch (_) {}
  loading.value = false;
}

async function showDetail(row) {
  try {
    const res = await api.getUserDetail(row.id);
    detail.value = res.data;
    detailVisible.value = true;
  } catch (_) {}
}

async function disableUser(row) {
  await ElMessageBox.confirm('确定禁用该用户账号？', '提示', { type: 'warning' });
  await api.updateUser(row.id, { status: 'disabled' });
  ElMessage.success('已禁用');
  loadList();
}

async function enableUser(row) {
  await api.updateUser(row.id, { status: 'active' });
  ElMessage.success('已启用');
  loadList();
}
</script>
