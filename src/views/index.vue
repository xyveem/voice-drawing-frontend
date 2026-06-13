<template>
  <div class="home-header">
    <span>欢迎 {{ userStore.nickName || '访客' }}</span>
    <el-button type="danger" @click="handleLogout">退出登录</el-button>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { logoutApi } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  try {
    // 调用后端登出接口
    await logoutApi()
  } catch (err) {
    console.warn('后端登出接口调用失败，仍清除本地登录态', err)
  }
  // 清空store+持久化+本地存储
  userStore.logout()
  ElMessage.success('已成功退出登录')
  // 跳转登录页
  router.replace('/login')
}
</script>

<style scoped lang="scss">
.home-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding: 15px 20px;
}
</style>
