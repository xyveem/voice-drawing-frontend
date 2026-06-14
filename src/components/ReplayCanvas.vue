<template>
  <canvas ref="replayCanvasRef" :width="width" :height="height"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  DrawOpType,
  type DrawOpList,
  type DrawOpItem
} from '@/types/drawRecord'

const props = defineProps<{
  opList: DrawOpList
  width: number
  height: number
  speed: number
}>()

const replayCanvasRef = ref<HTMLCanvasElement>()
let replayCtx: CanvasRenderingContext2D | null = null
let timerId: number | null = null
let playIndex = 0
let prevTime = 0
let isPlaying = false

// 初始化画布
const initCanvas = () => {
  if (!replayCtx || !replayCanvasRef.value) return
  replayCtx.clearRect(0, 0, props.width, props.height)
  replayCtx.fillStyle = '#fff'
  replayCtx.fillRect(0, 0, props.width, props.height)
}

// 执行单个操作
const execOp = (item: DrawOpItem) => {
  if (!replayCtx) return

  switch (item.type) {
    case DrawOpType.FREE:
      if (!item.points || item.points.length < 2) break
      replayCtx.beginPath()
      replayCtx.strokeStyle = item.color || '#000'
      replayCtx.lineWidth = item.lineWidth || 3
      replayCtx.lineCap = 'round'
      replayCtx.lineJoin = 'round'
      replayCtx.moveTo(item.points[0].x, item.points[0].y)
      item.points.forEach((p) => replayCtx!.lineTo(p.x, p.y))
      replayCtx.stroke()
      break

    case DrawOpType.LINE:
      replayCtx.beginPath()
      replayCtx.strokeStyle = item.color || '#000'
      replayCtx.lineWidth = item.lineWidth || 3
      replayCtx.moveTo(item.startX!, item.startY!)
      replayCtx.lineTo(item.endX!, item.endY!)
      replayCtx.stroke()
      break

    case DrawOpType.RECTANGLE:
      replayCtx.beginPath()
      replayCtx.strokeStyle = item.color || '#000'
      replayCtx.lineWidth = item.lineWidth || 3
      replayCtx.rect(
        item.startX!,
        item.startY!,
        item.endX! - item.startX!,
        item.endY! - item.startY!
      )
      replayCtx.stroke()
      break

    case DrawOpType.CIRCLE: {
      replayCtx.beginPath()
      replayCtx.strokeStyle = item.color || '#000'
      replayCtx.lineWidth = item.lineWidth || 3
      const r = Math.hypot(item.endX! - item.startX!, item.endY! - item.startY!)
      replayCtx.arc(item.startX!, item.startY!, r, 0, Math.PI * 2)
      replayCtx.stroke()
      break
    }

    case DrawOpType.CLEAR:
      replayCtx.clearRect(0, 0, props.width, props.height)
      replayCtx.fillStyle = '#fff'
      replayCtx.fillRect(0, 0, props.width, props.height)
      break

    case DrawOpType.UNDO:
    case DrawOpType.REDO:
      // 撤销/重做在回放中需要特殊处理，这里简单忽略
      // 实际可以通过维护 ImageData 栈实现，为简化先跳过
      break

    default:
      break
  }
}

// 开始播放
const startPlay = () => {
  if (!props.opList.length || isPlaying) return
  pausePlay()
  isPlaying = true
  playIndex = 0
  prevTime = 0
  initCanvas()

  const loop = () => {
    if (playIndex >= props.opList.length) {
      isPlaying = false
      return
    }
    const cur = props.opList[playIndex]
    const currentTime = cur.time
    let delay = currentTime - prevTime
    if (props.speed > 0) {
      delay = delay / props.speed
    }
    prevTime = currentTime

    timerId = window.setTimeout(
      () => {
        execOp(cur)
        playIndex++
        loop()
      },
      Math.max(0, delay)
    )
  }
  loop()
}

// 暂停播放
const pausePlay = () => {
  if (timerId) {
    clearTimeout(timerId)
    timerId = null
  }
  isPlaying = false
}

// 重置回放
const resetReplay = () => {
  pausePlay()
  initCanvas()
  playIndex = 0
  prevTime = 0
}

// 监听 opList 变化
watch(
  () => props.opList,
  () => {
    resetReplay()
  },
  { deep: true }
)

onMounted(() => {
  replayCtx = replayCanvasRef.value!.getContext('2d')!
  initCanvas()
})

defineExpose({
  startPlay,
  pausePlay,
  resetReplay
})
</script>

<style scoped>
canvas {
  width: 100%;
  border: 1px solid #efe5db;
  border-radius: 16px;
  background: #fff;
}
</style>
