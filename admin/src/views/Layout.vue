<template>
  <el-container>
    <el-aside width="220px">
      <div class="logo">文书审核系统</div>
      <el-menu :default-active="route.path" router background-color="#304156" text-color="#bfcbd9" active-text-color="#409EFF">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/reviews">
          <el-icon><Document /></el-icon>
          <span>审核记录</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Tickets /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
        <el-menu-item index="/marketing">
          <el-icon><Share /></el-icon>
          <span>推广统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-area">
              {{ userInfo?.nickname || '管理员' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout();
    router.push('/login');
  }
}
</script>

<style scoped>
.el-aside { background: #304156; min-height: 100vh; }
.logo { color: #fff; font-size: 18px; text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
.el-menu { border-right: none; }
.el-header { background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: flex-end; padding: 0 20px; }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-area { cursor: pointer; display: flex; align-items: center; gap: 4px; }
.el-main { background: #f0f2f5; min-height: calc(100vh - 60px); }
</style>
