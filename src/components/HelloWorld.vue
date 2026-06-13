<template>
  <div>
    <h1>Hello, Element Plus!</h1>
    <el-button type="primary" @click="handleClick">点击我</el-button>
    <div style="margin-top: 20px; font-size: 32px">
      <el-icon>
        <Plus />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElIcon } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
// 注册组件
const handleClick = () => {
  console.log('按钮被点击')
}
</script>
<style scoped>
h1 {
  color: #42b983;
}
</style>
