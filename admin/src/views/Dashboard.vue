<template>
  <div>
    <h3>数据概览</h3>

    <!-- 核心指标 -->
    <el-row :gutter="20" style="margin-bottom:20px">
      <el-col :span="6" v-for="item in overviewCards" :key="item.label">
        <el-card shadow="hover">
          <div class="overview-card">
            <div class="overview-num" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="overview-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 风险分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>风险等级分布</template>
          <div class="chart-placeholder">
            <el-progress v-if="riskDistribution" type="dashboard" :percentage="100" :color="riskColors">
              <template #default>
                <div>
                  <div>高风险: {{ riskDistribution.high }}</div>
                  <div>中风险: {{ riskDistribution.medium }}</div>
                  <div>低风险: {{ riskDistribution.low }}</div>
                </div>
              </template>
            </el-progress>
          </div>
        </el-card>
      </el-col>

      <!-- 会员分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>用户会员分布</template>
          <div v-if="memberDistribution.length">
            <div v-for="m in memberDistribution" :key="m.member_level" style="margin:8px 0">
              <span>{{ levelMap[m.member_level] || m.member_level }}：{{ m.count }}人</span>
              <el-progress
                :percentage="Math.round(m.count / totalMembers * 100)"
                :color="memberColors[m.member_level]"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';

const overview = ref({ totalUsers: 0, totalFiles: 0, totalReviews: 0, todayReviews: 0, activeUsersToday: 0 });
const riskDistribution = ref({ high: 0, medium: 0, low: 0 });
const memberDistribution = ref([]);

const overviewCards = computed(() => [
  { label: '用户总数', value: overview.value.totalUsers, color: '#409EFF' },
  { label: '文件总数', value: overview.value.totalFiles, color: '#67C23A' },
  { label: '审核总数', value: overview.value.totalReviews, color: '#E6A23C' },
  { label: '今日审核', value: overview.value.todayReviews, color: '#F56C6C' },
]);

const riskColors = ['#F56C6C', '#E6A23C', '#67C23A'];
const totalMembers = computed(() => memberDistribution.value.reduce((s, m) => s + m.count, 0) || 1);
const levelMap = { free: '普通用户', vip: 'VIP会员', svip: 'SVIP会员' };
const memberColors = { free: '#909399', vip: '#E6A23C', svip: '#F56C6C' };

onMounted(async () => {
  try {
    const res = await api.getDashboard();
    overview.value = res.data.overview;
    riskDistribution.value = res.data.riskDistribution;
    memberDistribution.value = res.data.memberDistribution;
  } catch (_) {}
});
</script>

<style scoped>
.overview-card { text-align: center; padding: 10px 0; }
.overview-num { font-size: 36px; font-weight: bold; }
.overview-label { font-size: 14px; color: #909399; margin-top: 8px; }
.chart-placeholder { text-align: center; padding: 20px; }
</style>
