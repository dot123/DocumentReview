<template>
  <router-view />
</template>

<script setup>
import { useUserStore } from './store/user';

const userStore = useUserStore();
userStore.init();
</script>

<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
#app { height: 100vh; }

/* 下拉选择框最小宽度 */
.el-select { min-width: 140px; }
.el-select .el-select__placeholder { white-space: nowrap; overflow: visible; }
</style>
