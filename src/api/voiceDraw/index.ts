import http from '@/http'

// 语音绘图接口
export function voiceDrawApi(
  body: Record<string, string>,
  canvasWidth: number,
  canvasHeight: number
) {
  return http.post(
    `/draw-api/chat/voice?canvasWidth=${canvasWidth}&canvasHeight=${canvasHeight}`,
    body
  )
}
