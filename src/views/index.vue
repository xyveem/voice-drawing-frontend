<template>
  <div class="studio-card">
    <!--顶部导航栏-->
    <div class="top-bar">
      <div class="logo-area">
        <h1>🎨 声绘 | Voice Gallery</h1>
        <p>语音 · 绘画 · 创作</p>
      </div>
      <div class="nav-links">
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: $route.path === '/' }"
          >画室</router-link
        >
        <router-link
          to="/pictureList"
          class="nav-link"
          :class="{ active: $route.path === '/pictureList' }"
          >画廊</router-link
        >
        <div class="user-info">
          <span class="user-name">👤 {{ userStore.nickName || '访客' }}</span>
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </div>

    <div class="three-columns">
      <!-- 替换为封装好的AI语音组件 -->
      <AiVoiceDraw
        ref="aiChatRef"
        :canvas-width="800"
        :canvas-height="550"
        @draw-steps-ready="handleDrawSteps"
      />

      <!--中间画板组件-->
      <div class="canvas-area">
        <CanvasDraw
          ref="canvasRef"
          :canvas-width="800"
          :canvas-height="550"
          :is-listening="isListening"
          @save-image="handleSaveImage"
        />
      </div>

      <!--右侧工具栏-->
      <div class="tools-area">
        <!--颜色面板-->
        <div class="tool-section">
          <h4>🎨 画笔颜色</h4>
          <div class="color-palette">
            <div
              v-for="c in colorList"
              :key="c"
              class="color-option"
              :class="{ active: selectColor === c }"
              :style="{
                background: c,
                border: c === '#ffffff' ? '1px solid #e0e0e0' : 'none'
              }"
              @click="
                () => {
                  selectColor = c
                  canvasRef?.setColor(c)
                }
              "
            ></div>
            <!-- 自定义颜色选择器 -->
            <input
              type="color"
              v-model="selectColor"
              class="color-picker"
              @change="canvasRef?.setColor(selectColor)"
              title="自定义颜色"
            />
          </div>
        </div>

        <div class="tool-section">
          <h4>✏️ 画笔粗细</h4>
          <div class="stroke-width-control">
            <input
              type="range"
              min="1"
              max="20"
              v-model="strokeWidth"
              class="stroke-slider"
              @input="canvasRef?.setLineWidth(parseInt(strokeWidth))"
            />
            <span class="width-value">{{ strokeWidth }}px</span>
          </div>
        </div>

        <!--操作按钮-->
        <div class="tool-section">
          <h4>🔧 绘图工具</h4>
          <div class="tool-buttons">
            <div
              class="tool-icon"
              :class="{ active: !eraser }"
              @click="
                () => {
                  eraser = false
                  canvasRef?.toggleEraser(false)
                }
              "
            >
              ✏️画笔
            </div>
            <div
              class="tool-icon"
              :class="{ active: eraser }"
              @click="
                () => {
                  eraser = true
                  canvasRef?.toggleEraser(true)
                }
              "
            >
              🧽橡皮
            </div>
            <div class="tool-icon" @click="canvasRef?.clearCanvas()">
              🗑️清空
            </div>
            <div class="tool-icon" @click="canvasRef?.undo()">↩️撤销</div>
            <div class="tool-icon" @click="canvasRef?.redo()">↪️重做</div>
          </div>
        </div>

        <!--图形模式-->
        <div class="tool-section">
          <h4>📐 图形模式</h4>
          <div class="shape-modes">
            <div
              v-for="item in shapeList"
              :key="item.mode"
              class="shape-btn"
              :class="{ active: currentShape === item.mode }"
              @click="
                () => {
                  currentShape = item.mode
                  canvasRef?.setDrawMode(item.mode)
                }
              "
            >
              {{ item.label }}
            </div>
          </div>
        </div>

        <!--语音状态+保存作品-->
        <div class="voice-status">
          <div class="led" :class="{ active: isListening }"></div>
          <span>{{ isListening ? '聆听中...' : '等待唤醒' }}</span>
          <button class="wake-btn" @click="toggleListen">
            🎤{{ isListening ? '停止收音' : '开始说话' }}
          </button>
          <button class="save-work-btn" @click="canvasRef?.exportBase64()">
            保存画作
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CanvasDraw from '@/components/CanvasDraw.vue'
import AiVoiceDraw from '@/components/AiVoiceDraw.vue'
import { createPictureApi } from '@/api/picture'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { logoutApi } from '@/api/user'
import type { DrawOpItem } from '@/types/drawRecord'

// 定义绘图步骤类型
interface DrawStep {
  type: string
  color?: string
  lineWidth?: number
  points?: Array<{ x: number; y: number }>
  startX?: number
  startY?: number
  endX?: number
  endY?: number
  startXPercent?: number
  startYPercent?: number
  endXPercent?: number
  endYPercent?: number
}

interface PointItem {
  x: number
  y: number
}

const router = useRouter()
const userStore = useUserStore()

const canvasRef = ref<InstanceType<typeof CanvasDraw>>()
const aiChatRef = ref<InstanceType<typeof AiVoiceDraw>>()

// 工具栏绑定变量
const selectColor = ref('#000000')
const strokeWidth = ref(3)
const eraser = ref(false)
const isListening = ref(false)
const currentShape = ref<'free' | 'line' | 'rectangle' | 'circle' | 'ellipse'>(
  'free'
)

// 画布固定尺寸
const canvasWidth = 800
const canvasHeight = 550
const playDelay = 700

const colorList = [
  '#000000',
  '#ff0000',
  '#ff6900',
  '#00cc00',
  '#0000ff',
  '#d4a574',
  '#9b59b6',
  '#ffffff'
]
const shapeList = [
  { mode: 'free', label: '自由手绘' },
  { mode: 'line', label: '直线' },
  { mode: 'rectangle', label: '矩形' },
  { mode: 'circle', label: '圆形' },
  { mode: 'ellipse', label: '椭圆' }
]

// 百分比转像素（保留备用）
// const p2px = (percent: number, total: number) => (percent / 100) * total

// 单条指令绘制
async function singleDraw(step: DrawStep) {
  const canvas = canvasRef.value!
  const { type, color, lineWidth, points, startX, startY, endX, endY } = step

  if (color) canvas.setColor(color)
  if (lineWidth) canvas.setLineWidth(lineWidth)

  switch (type) {
    case 'free': {
      if (points && points.length > 0) {
        const pxPoints = points.map((p: PointItem) => ({
          x: p.x,
          y: p.y
        }))
        canvas.drawFreeByPoints(pxPoints)
      }
      break
    }
    case 'line':
      if (startX !== undefined && endX !== undefined) {
        canvas.drawLineByCoord(startX, startY!, endX, endY!)
      }
      break
    case 'rectangle':
      if (startX !== undefined && endX !== undefined) {
        canvas.drawRectByCoord(startX, startY!, endX, endY!)
      }
      break
    case 'circle':
      if (startX !== undefined && endX !== undefined) {
        canvas.drawCircleByCoord(startX, startY!, endX, endY!)
      }
      break
    case 'ellipse':
      if (startX !== undefined && endX !== undefined) {
        canvas.drawEllipseByCoord(startX, startY!, endX, endY!)
      }
      break
    case 'eraser':
      canvas.toggleEraser(true)
      break
    case 'undo':
      canvas.undo()
      break
    case 'clear':
      canvas.clearCanvas()
      break
  }
}

// 接收子组件传回的绘制步骤，串行执行
async function handleDrawSteps(steps: DrawStep[]) {
  if (!steps || steps.length === 0) return
  for (const step of steps) {
    await singleDraw(step)
    await new Promise((resolve) => setTimeout(resolve, playDelay))
  }
}

// 麦克风启停
async function toggleListen() {
  if (!isListening.value) {
    isListening.value = true
    await aiChatRef.value?.startAudioRecord()
    ElMessage.info('请口述绘图指令，再次点击结束收音')
  } else {
    isListening.value = false
    await aiChatRef.value?.stopAudioRecordAndSend()
  }
}

// 接收画板抛出的base64，上传后端
const handleSaveImage = async (base64: string, opList: DrawOpItem[]) => {
  const empty = canvasRef.value?.isCanvasEmpty()
  if (empty) {
    ElMessage.warning('画布为空，无法保存')
    return
  }
  try {
    const res = await fetch(base64)
    const blob = await res.blob()
    const file = new File([blob], 'drawing.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', '我的手绘作品')
    formData.append('voiceCommand', '')
    formData.append('operationList', JSON.stringify(opList))
    await createPictureApi(formData)
    ElMessage.success('作品保存成功')
    canvasRef.value?.resetRecording()
  } catch {
    ElMessage.error('保存失败')
  }
}

// 登出处理
const handleLogout = async () => {
  try {
    await logoutApi()
  } catch (err) {
    console.warn('后端登出接口调用失败，仍清除本地登录态', err)
  }
  userStore.logout()
  ElMessage.success('已成功退出登录')
  router.replace('/login')
}
</script>

<style scoped lang="scss">
/* 样式保持不变，省略... */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #faf7f2;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  color: #2c2c2c;
  min-height: 100vh;
  padding: 24px;
}

/* 主容器 */
.studio-card {
  max-width: 1600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
  border-radius: 32px;
  box-shadow:
    0 20px 35px -12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(212, 165, 116, 0.1);
  overflow: hidden;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 20px 28px 16px 28px;
  border-bottom: 1px solid #f0e8de;
  flex-wrap: wrap;
  gap: 12px;
}

.logo-area h1 {
  font-size: 1.6rem;
  font-weight: 500;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #d4a574 0%, #b8895c 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.logo-area p {
  font-size: 0.75rem;
  color: #9e9e9e;
  margin-top: 4px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;

  .nav-link {
    text-decoration: none;
    color: #5c5c5c;
    font-weight: 460;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: #d4a574;
    }

    &.active {
      color: #d4a574;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 20px;
    padding-left: 20px;
    border-left: 1px solid #e8e0d5;

    .user-name {
      font-size: 14px;
      color: #5c4b3a;
      font-weight: 500;
    }

    .logout-btn {
      background: transparent;
      border: 1px solid #e8e0d5;
      color: #d4a574;
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s ease;

      &:hover {
        background: #d4a574;
        color: white;
        border-color: #d4a574;
      }
    }
  }
}

/* 三栏布局 */
.three-columns {
  display: flex;
  gap: 20px;
  padding: 24px 28px;
  flex-wrap: wrap;
}

/* 中间 - 画板区域 */
.canvas-area {
  flex: 2;
  min-width: 400px;
}

/* 右侧 - 画笔工具区域 */
.tools-area {
  flex: 0.8;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 28px;
  border: 1px solid #f0e8de;
  padding: 20px;
}

.tool-section {
  margin-bottom: 28px;
}

.tool-section h4 {
  font-size: 0.75rem;
  color: #9e9e9e;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

/* 颜色选择器 */
.color-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #2c2c2c;
  box-shadow: 0 0 0 2px #faf7f2;
}

/* 画笔粗细控制 */
.stroke-width-control {
  display: flex;
  align-items: center;
  gap: 12px;

  .stroke-slider {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    accent-color: #d4a574;
  }

  .width-value {
    font-size: 0.7rem;
    color: #b2a189;
    min-width: 40px;
  }
}

/* 工具按钮组 */
.tool-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tool-icon {
  background: white;
  border: 1px solid #efe5db;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tool-icon:hover {
  border-color: #d4a574;
  background: #fff9f2;
}

.tool-icon.active {
  background: #d4a574;
  border-color: #d4a574;
  color: white;
}

/* 图形模式 */
.shape-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.shape-btn {
  background: white;
  border: 1px solid #efe5db;
  border-radius: 30px;
  padding: 6px 14px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
}

.shape-btn.active {
  background: #d4a574;
  border-color: #d4a574;
  color: white;
}

/* 状态指示器 */
.voice-status {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #efe5db;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.led {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #b0b0b0;
}

.led.active {
  background-color: #d4a574;
  animation: pulse 1.2s infinite;
}

.wake-btn,
.save-work-btn {
  background: #fff;
  padding: 4px 12px;
  border-radius: 40px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #efe5db;
  transition: 0.2s;
}
.save-work-btn {
  background-color: #d4a574;
  color: #fff;
  border-color: #d4a574;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 1000px) {
  .three-columns {
    flex-direction: column;
  }
  .canvas-area {
    min-width: auto;
  }
  body {
    padding: 16px;
  }
}
</style>
