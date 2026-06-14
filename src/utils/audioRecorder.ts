let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

export async function startRecord() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mpeg' })
  audioChunks = []
  mediaRecorder.ondataavailable = (e) => {
    audioChunks.push(e.data)
  }
  mediaRecorder.start()
}

export async function stopRecord(): Promise<string> {
  return new Promise((resolve) => {
    mediaRecorder!.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/mpeg' })
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
    }
    mediaRecorder!.stop()
  })
}
