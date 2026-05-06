<template>
  <div>
    <h3>推广统计</h3>

    <el-row :gutter="20" style="margin-bottom:20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-num">{{ data.totalInvites }}</div>
            <div class="stat-label">总邀请次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" v-for="m in data.memberStats" :key="m.member_level">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-num" :style="{ color: memberColors[m.member_level] }">{{ m.count }}</div>
            <div class="stat-label">{{ memberLabel[m.member_level] }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>邀请排行榜</template>
      <el-table :data="data.topInviters" border stripe>
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column label="用户" width="150">
          <template #default="{ row }">{{ row.inviter?.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="手机号" width="150">
          <template #default="{ row }">{{ row.inviter?.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="invite_count" label="邀请人数" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../api';

const data = reactive({ totalInvites: 0, topInviters: [], memberStats: [] });

const memberLabel = { free: '普通用户', vip: 'VIP会员', svip: 'SVIP会员' };
const memberColors = { free: '#909399', vip: '#E6A23C', svip: '#F56C6C' };

onMounted(async () => {
  try {
    const res = await api.getMarketingOverview();
    Object.assign(data, res.data);
  } catch (_) {}
});
</script>

<style scoped>
.stat-card { text-align: center; padding: 10px 0; }
.stat-num { font-size: 36px; font-weight: bold; color: #409EFF; }
.stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
</style>
