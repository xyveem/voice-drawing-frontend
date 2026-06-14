<template>
  <div class="gallery-container">
    <!-- 顶部导航 -->
    <div class="gallery-nav">
      <div class="title-section">
        <h2>时光画廊</h2>
        <p>每一幅手绘，都是创作印记</p>
      </div>
      <div class="nav-buttons">
        <router-link to="/">← 画室</router-link>
        <span class="active">画廊</span>
      </div>
    </div>

    <!-- 作品网格 -->
    <div class="gallery-grid" v-if="list.length">
      <div
        v-for="item in list"
        :key="item.id"
        class="art-card"
        @click="openDetail(item.id)"
      >
        <div class="card-img">
          <img :src="'data:image/png;base64,' + item.contentBase64" alt="" />
        </div>
        <div class="card-info">
          <div class="card-title">{{ item.title }}</div>
          <div class="card-meta">
            <span>📅 {{ formatTime(item.createTime) }}</span>
            <span v-if="item.voiceCommand">🎤 {{ item.voiceCommand }}</span>
          </div>
          <el-button
            link
            type="danger"
            size="small"
            @click.stop="handleDel(item.id)"
            >删除</el-button
          >
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-gallery" v-else>✨ 还没有画作，前往画室创作吧</div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="画作详情"
      width="60%"
      :modal="true"
      :append-to-body="true"
      class="art-detail-dialog"
      top="10vh"
    >
      <div class="dialog-content">
        <div class="dialog-img">
          <img
            v-if="detailItem?.contentBase64"
            :src="'data:image/png;base64,' + detailItem.contentBase64"
            alt="画作"
          />
        </div>
        <div class="dialog-info">
          <h3>{{ detailItem?.title }}</h3>
          <p class="time">📅 {{ formatTime(detailItem?.createTime) }}</p>
          <p v-if="detailItem?.voiceCommand" class="voice">
            🎤 语音指令：{{ detailItem.voiceCommand }}
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMyPictureListApi,
  getPictureDetailApi,
  deletePictureApi
} from '@/api/picture'
import type { PictureVO, PictureDetailVO } from '@/api/picture/PictureModel'

const list = ref<PictureVO[]>([])
const dialogVisible = ref(false)
const detailItem = ref<PictureDetailVO | null>(null)

// 加载我的画作列表
const loadList = async () => {
  const res = await getMyPictureListApi()
  list.value = res.data
}

// 打开详情弹窗
const openDetail = async (id: number) => {
  const res = await getPictureDetailApi(id)
  detailItem.value = res.data
  dialogVisible.value = true
}

// 删除画作
const handleDel = (id: number) => {
  ElMessageBox.confirm('确定要删除这幅作品？删除后不可恢复', '提示', {
    type: 'warning'
  }).then(async () => {
    await deletePictureApi(id)
    ElMessage.success('删除成功')
    loadList()
  })
}

// 时间格式化
const formatTime = (t: string | Date) => {
  if (!t) return ''
  return new Date(t).toLocaleString()
}

onMounted(loadList)
</script>

<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #faf7f2;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
  padding: 32px;
  color: #2c2c2c;
}

.gallery-container {
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 240, 0.6);
  backdrop-filter: blur(2px);
  border-radius: 40px;
  padding: 28px 32px 48px;
  border: 1px solid #efe5db;
}

/* 头部导航 */
.gallery-nav {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e0d5;
}

.title-section h2 {
  font-size: 1.9rem;
  font-weight: 450;
  background: linear-gradient(135deg, #d4a574 20%, #9c7a5c 80%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.title-section p {
  color: #9e9e9e;
  font-size: 0.85rem;
  margin-top: 6px;
}

.nav-buttons {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-buttons a {
  text-decoration: none;
  color: #5c5c5c;
  font-weight: 460;
}
.nav-buttons .active {
  color: #d4a574;
}

/* 瀑布流网格 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 28px;
  margin-top: 20px;
}

/* 卡片 */
.art-card {
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: 0 6px 12px -8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0e4d8;
  cursor: pointer;
}

.art-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -12px rgba(0, 0, 0, 0.12);
  border-color: #d4a574;
}

.card-img {
  width: 100%;
  aspect-ratio: 1 / 0.9;
  background-color: #fcf8f0;
  border-bottom: 1px solid #f0e4d8;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.card-info {
  padding: 16px 18px 20px;
}

.card-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 6px;
  color: #2e2e2e;
}

.card-meta {
  font-size: 0.7rem;
  color: #b2a189;
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.empty-gallery {
  text-align: center;
  padding: 80px 20px;
  color: #bbaa95;
  font-size: 1.1rem;
}

.art-detail-dialog.el-dialog {
  border-radius: 24px;

  .el-dialog__header {
    padding: 20px 24px 0;
    border-bottom: 1px solid #f0e4d8;
  }

  .el-dialog__body {
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .dialog-img {
    background: #fcf8f0;
    border-radius: 16px;
    display: flex;
    justify-content: center;
    align-items: center;

    img {
      width: auto;
      max-width: 100%;
      max-height: 60vh;
      object-fit: contain;
      border-radius: 12px;
      border: 2px solid #f0e4d8;
    }
  }

  .dialog-info {
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #2e2e2e;
    }

    .time,
    .voice {
      color: #b2a189;
      font-size: 0.85rem;
      margin: 8px 0;
    }
  }
}
</style>
