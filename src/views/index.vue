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
      <!--左侧AI对话-->
      <div class="ai-chat-area">
        <div class="chat-header">
          <h3>🤖 AI 画师 · 小画</h3>
        </div>
        <div class="chat-messages" ref="chatMsgRef">
          <div class="message ai">
            <div class="message-bubble">你好呀！我是小画～</div>
            <div class="message-time">刚刚</div>
          </div>
        </div>
        <div class="chat-input-area">
          <input
            v-model="msgText"
            placeholder="输入文字指令..."
            @keyup.enter="sendMsg"
          />
          <button class="send-btn" @click="sendMsg">发送</button>
        </div>
      </div>

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
          <button class="wake-btn" @click="isListening = !isListening">
            🎤唤醒
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
import { createPictureApi } from '@/api/picture'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { logoutApi } from '@/api/user'
import type { DrawOpItem } from '@/types/drawRecord'

const router = useRouter()
const userStore = useUserStore()

const canvasRef = ref<InstanceType<typeof CanvasDraw>>()
const chatMsgRef = ref<HTMLDivElement>()
const msgText = ref('')

// 工具栏绑定变量
const selectColor = ref('#000000')
const strokeWidth = ref(3)
const eraser = ref(false)
const isListening = ref(false)
const currentShape = ref<'free' | 'line' | 'rectangle' | 'circle'>('free')

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
  { mode: 'circle', label: '圆形' }
]

// 发送聊天消息
const sendMsg = () => {
  if (!msgText.value.trim()) return
  // 追加消息DOM逻辑自行补齐
  msgText.value = ''
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
    formData.append('operationList', JSON.stringify(opList)) // 保存操作记录
    await createPictureApi(formData)
    ElMessage.success('作品保存成功')
    canvasRef.value?.resetRecording() // 重置记录
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
    text-decoration: none; // 去掉下划线
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

  // 画廊页面的激活样式通过路由判断单独处理
  .nav-link:first-child.active {
    color: #d4a574;
  }

  .nav-link:last-child.active {
    color: #5c5c5c;
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

/* 左侧 - AI对话区域 */
.ai-chat-area {
  flex: 1;
  min-width: 260px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 28px;
  border: 1px solid #f0e8de;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 20px 20px 12px;
  border-bottom: 1px solid #efe5db;
}

.chat-header h3 {
  font-size: 1rem;
  font-weight: 500;
  color: #d4a574;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-height: 450px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 90%;
}

.message.user {
  align-items: flex-end;
  align-self: flex-end;
}

.message.ai {
  align-items: flex-start;
  align-self: flex-start;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.message.user .message-bubble {
  background: #d4a574;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.ai .message-bubble {
  background: white;
  border: 1px solid #efe5db;
  color: #2c2c2c;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 0.65rem;
  color: #b2a189;
  margin-top: 4px;
  margin-left: 8px;
  margin-right: 8px;
}

.chat-input-area {
  padding: 16px;
  border-top: 1px solid #efe5db;
  display: flex;
  gap: 10px;
}

.chat-input-area input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #efe5db;
  border-radius: 40px;
  font-size: 0.85rem;
  background: white;
  outline: none;
}

.chat-input-area input:focus {
  border-color: #d4a574;
}

.send-btn {
  background: #d4a574;
  border: none;
  border-radius: 40px;
  padding: 0 20px;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
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

/* 画笔宽度 */
.stroke-width-slider {
  width: 100%;
  accent-color: #d4a574;
}

.width-value {
  font-size: 0.7rem;
  color: #b2a189;
  margin-top: 6px;
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

/* 形状模式 */
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
</style>
