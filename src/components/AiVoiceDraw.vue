<template>
  <div class="ai-chat-area">
    <div class="chat-header">
      <h3>🤖 AI 画师 · 小画</h3>
    </div>
    <div class="chat-messages" ref="chatMsgRef">
      <div
        v-for="(item, idx) in msgList"
        :key="idx"
        class="message"
        :class="item.role"
      >
        <div class="message-bubble">
          {{ item.text }}
          <div v-if="item.audio" class="audio-btn-wrap">
            <button class="audio-btn" @click="togglePlay(idx)">
              {{ item.playing ? '⏹' : '▶' }}
            </button>
          </div>
        </div>
        <div class="message-time">刚刚</div>
      </div>
    </div>
    <!-- 模板只改input-bar，不变其他 -->
    <div class="chat-input-area">
      <input
        v-model="msgText"
        placeholder="输入文字指令..."
        @keyup.enter="sendMsg"
      />
      <button
        class="record-btn"
        @mousedown="startLocalRecord"
        @mouseup="stopLocalRecordSend"
        @mouseleave="stopLocalRecordSend"
      >
        按住说话
      </button>
      <button class="send-btn" @click="sendMsg">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { startRecord, stopRecord } from '@/utils/audioRecorder'
import { voiceDrawApi } from '@/api/voiceDraw'

const props = defineProps<{
  canvasWidth: number
  canvasHeight: number
}>()
const emit = defineEmits(['drawStepsReady'])

const chatMsgRef = ref<HTMLDivElement>()
const msgText = ref('')

// 聊天消息结构化存储，附带音频状态
type ChatItem = {
  role: 'user' | 'ai'
  text: string
  audio?: string
  playing: boolean
}
const msgList = ref<ChatItem[]>([
  { role: 'ai', text: '你好呀！我是小画～', playing: false }
])

// 全局音频实例、当前播放索引，实现互斥
let audioPlayer: HTMLAudioElement | null = null
let activePlayIdx: number | null = null

// 停止所有正在播放语音
const stopAllAudio = () => {
  if (audioPlayer) {
    audioPlayer.pause()
    audioPlayer.src = ''
    audioPlayer = null
  }
  if (activePlayIdx !== null && msgList.value[activePlayIdx]) {
    msgList.value[activePlayIdx].playing = false
  }
  activePlayIdx = null
}

// 切换单条语音播放/停止
const togglePlay = (idx: number) => {
  const item = msgList.value[idx]
  if (!item.audio) return

  if (item.playing) {
    stopAllAudio()
    return
  }
  stopAllAudio()

  const src = `data:audio/mp3;base64,${item.audio}`
  audioPlayer = new Audio(src)
  item.playing = true
  activePlayIdx = idx

  audioPlayer.onended = () => {
    item.playing = false
    audioPlayer = null
    activePlayIdx = null
  }
  audioPlayer.play().catch(() => {
    item.playing = false
  })
}

// 自动滚动到底部
const scrollBottom = () => {
  nextTick(() => {
    if (chatMsgRef.value) {
      chatMsgRef.value.scrollTop = chatMsgRef.value.scrollHeight
    }
  })
}

// 新增聊天消息
const pushMsg = (role: 'user' | 'ai', text: string, audio?: string) => {
  const newItem: ChatItem = {
    role,
    text,
    audio,
    playing: false
  }
  msgList.value.push(newItem)
  scrollBottom()

  // AI消息 + 有音频，延迟自动播放
  if (role === 'ai' && audio) {
    const newIndex = msgList.value.length - 1
    setTimeout(() => togglePlay(newIndex), 600)
  }
}

// 统一请求接口
async function sendTextOrVoice(content?: string, audio?: string) {
  const reqData: Record<string, string> = {}
  if (audio) reqData.audio = audio
  else reqData.content = content!

  try {
    const resWrap = await voiceDrawApi(
      reqData,
      props.canvasWidth,
      props.canvasHeight
    )
    const data = resWrap.data

    if (content) pushMsg('user', content)

    // ========== 只修改这里 ==========
    const aiTip =
      data.replyText ||
      (data.drawSteps?.length
        ? `解析完成，共${data.drawSteps.length}步，自动绘制中`
        : '未能识别绘图指令，请重新描述')
    // ==================================

    pushMsg('ai', aiTip, data.audio)
    emit('drawStepsReady', data.drawSteps ?? [])
  } catch (err) {
    pushMsg('ai', '接口请求失败，请重试')
  }
}

// 文字发送
const sendMsg = async () => {
  const t = msgText.value.trim()
  if (!t) return
  msgText.value = ''
  await sendTextOrVoice(t)
}

// 内置本地录音，不再依赖父组件
let localAudioBase64 = ''
async function startLocalRecord() {
  await startRecord()
}
async function stopLocalRecordSend() {
  try {
    localAudioBase64 = await stopRecord()
    if (localAudioBase64) {
      pushMsg('user', '[语音消息]')
      await sendTextOrVoice(undefined, localAudioBase64)
    }
  } catch {
    pushMsg('ai', '录音获取失败')
  }
}

// 保留向外暴露方法（兼容旧父组件引用，可删除）
async function startAudioRecord() {
  await startLocalRecord()
}
async function stopAudioRecordAndSend() {
  await stopLocalRecordSend()
}
defineExpose({
  startAudioRecord,
  stopAudioRecordAndSend
})
</script>

<style scoped lang="scss">
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

/* 语音按钮样式 */
.audio-btn-wrap {
  margin-top: 10px;
}
.audio-btn {
  border: none;
  background: #d4a574;
  color: #fff;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.audio-btn:hover {
  opacity: 0.85;
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
  gap: 8px;
  align-items: center;
  flex-shrink: 0;

  input {
    flex: 1;
    min-width: 0; /* 关键：input收缩不挤压按钮 */
    padding: 10px 16px;
    border: 1px solid #efe5db;
    border-radius: 40px;
    font-size: 0.85rem;
    background: white;
    outline: none;
  }

  input:focus {
    border-color: #d4a574;
  }

  .send-btn {
    flex-shrink: 0;
    background: #d4a574;
    border: none;
    border-radius: 40px;
    padding: 0 16px;
    height: 40px;
    color: white;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .record-btn {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #d4a574;
    border-radius: 40px;
    padding: 0 12px;
    height: 40px;
    color: #d4a574;
    cursor: pointer;
    user-select: none;
    font-size: 0.8rem;
  }
  .record-btn:active {
    background: #f3e9dd;
  }
}
</style>
