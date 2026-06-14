<template>
  <div class="canvas-wrapper" :class="{ listening: isListening }">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  canvasWidth: number
  canvasHeight: number
  isListening: boolean
}>()

const emit = defineEmits<{
  saveImage: [base64: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// 绘图状态
const painting = ref(false)
const currentColor = ref('#000000')
const lineWidth = ref(3)
const isEraser = ref(false)
const drawMode = ref<'free' | 'line' | 'rectangle' | 'circle'>('free')
const startPos = ref({ x: 0, y: 0 })

// 撤销重做栈
const undoStack: ImageData[] = []
const redoStack: ImageData[] = []

// 保存画布快照
const saveSnapshot = () => {
  if (!ctx || !canvasRef.value) return
  const data = ctx.getImageData(0, 0, props.canvasWidth, props.canvasHeight)
  undoStack.push(data)
  redoStack.length = 0
  if (undoStack.length > 50) undoStack.shift()
}

// 撤销
const undo = () => {
  if (undoStack.length <= 1) return
  const last = undoStack.pop()!
  redoStack.push(last)
  ctx!.putImageData(undoStack[undoStack.length - 1], 0, 0)
}

// 重做
const redo = () => {
  if (!redoStack.length) return
  const data = redoStack.pop()!
  undoStack.push(data)
  ctx!.putImageData(data, 0, 0)
}

// 清空画布
const clearCanvas = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
  saveSnapshot()
}

// 设置画笔颜色
const setColor = (color: string) => {
  currentColor.value = color
  isEraser.value = false
}

// 切换橡皮擦
const toggleEraser = (val: boolean) => {
  isEraser.value = val
}

// 设置线条宽度
const setLineWidth = (w: number) => {
  lineWidth.value = w
}

// 切换绘制模式
const setDrawMode = (mode: typeof drawMode.value) => {
  drawMode.value = mode
}

// 鼠标按下
const onMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value || !ctx) return
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = props.canvasWidth / rect.width
  const scaleY = props.canvasHeight / rect.height
  startPos.value.x = (e.clientX - rect.left) * scaleX
  startPos.value.y = (e.clientY - rect.top) * scaleY

  painting.value = true
  if (drawMode.value === 'free') {
    ctx.beginPath()
    ctx.moveTo(startPos.value.x, startPos.value.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
}

// 鼠标移动
const onMouseMove = (e: MouseEvent) => {
  if (!painting.value || !canvasRef.value || !ctx) return
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = props.canvasWidth / rect.width
  const scaleY = props.canvasHeight / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  ctx.strokeStyle = isEraser.value ? '#fff' : currentColor.value
  ctx.lineWidth = lineWidth.value

  if (drawMode.value === 'free') {
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  } else {
    // 先恢复上一步画布
    if (undoStack.length) ctx.putImageData(undoStack.at(-1)!, 0, 0)
    ctx.beginPath()
    ctx.strokeStyle = isEraser.value ? '#fff' : currentColor.value
    ctx.lineWidth = lineWidth.value
    switch (drawMode.value) {
      case 'line':
        ctx.moveTo(startPos.value.x, startPos.value.y)
        ctx.lineTo(x, y)
        break
      case 'rectangle':
        ctx.rect(
          startPos.value.x,
          startPos.value.y,
          x - startPos.value.x,
          y - startPos.value.y
        )
        break
      case 'circle': {
        const r = Math.hypot(x - startPos.value.x, y - startPos.value.y)
        ctx.arc(startPos.value.x, startPos.value.y, r, 0, Math.PI * 2)
        break
      }
    }
    ctx.stroke()
  }
}

// 鼠标抬起
const onMouseUp = () => {
  if (!painting.value || !ctx) return
  painting.value = false
  saveSnapshot()
}

const isCanvasEmpty = () => {
  if (!ctx || !canvasRef.value) return true
  const imgData = ctx.getImageData(0, 0, props.canvasWidth, props.canvasHeight)
  const data = imgData.data
  // 遍历像素，只要有一个像素不是纯白，说明画了内容
  for (let i = 0; i < data.length; i += 4) {
    // R G B 全255=纯白
    if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
      return false
    }
  }
  return true
}

// 导出base64并抛出事件
const exportBase64 = () => {
  if (!canvasRef.value) return
  const base64 = canvasRef.value.toDataURL('image/png')
  emit('saveImage', base64)
}

onMounted(() => {
  ctx = canvasRef.value!.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
  saveSnapshot()
})

// 向外暴露方法给父组件调用
defineExpose({
  undo,
  redo,
  clearCanvas,
  setColor,
  toggleEraser,
  setLineWidth,
  setDrawMode,
  exportBase64,
  isCanvasEmpty
})
</script>

<style scoped lang="scss">
.canvas-wrapper {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8e0d5;
  overflow: hidden;
  canvas {
    display: block;
    width: 100%;
    height: auto;
    cursor: crosshair;
  }
}
.canvas-wrapper.listening {
  box-shadow:
    0 0 0 2px #d4a574,
    0 10px 20px -5px rgba(0, 0, 0, 0.1);
  border-color: #d4a574;
}
</style>
