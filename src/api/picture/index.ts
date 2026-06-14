import http from '@/http'

// 保存画作（FormData）
export const createPictureApi = (data: FormData) => {
  return http.post('/draw-api/pictures', data)
}

// 获取当前用户所有画作（后端自动拿userId，无需传参）
export const getMyPictureListApi = () => {
  return http.get('/draw-api/pictures/my')
}

// 单张详情
export const getPictureDetailApi = (id: number) => {
  return http.get(`/draw-api/pictures/${id}`)
}

// 删除画作
export const deletePictureApi = (id: number) => {
  return http.delete(`/draw-api/pictures/${id}`)
}
