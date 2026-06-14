export enum DrawOpType {
  FREE = 'free',
  LINE = 'line',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  CLEAR = 'clear',
  UNDO = 'undo',
  REDO = 'redo'
}

export interface Point {
  x: number
  y: number
}

export interface DrawOpItem {
  type: DrawOpType
  time: number // 相对时间戳（ms）
  color?: string
  lineWidth?: number
  points?: Point[] // 自由绘制用
  startX?: number // 形状用
  startY?: number
  endX?: number
  endY?: number
}

export type DrawOpList = DrawOpItem[]
