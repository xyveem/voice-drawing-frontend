export interface PictureVO {
  id: number
  title: string
  contentBase64: string
  voiceCommand: string
  createTime: string
}

export interface PictureDetailVO {
  id: number
  userId: number
  title: string
  contentBase64: string
  voiceCommand: string
  createTime: string
  operationList?: string
}
