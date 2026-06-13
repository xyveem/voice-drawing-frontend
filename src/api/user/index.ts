import http from '@/http'

// 发送验证码
export const sendSmsApi = (phone: string) => {
  return http.post(`/draw-api/common/sendSms?phone=${phone}`)
}

// 手机号登录
export const loginApi = (phone: string, code: string) => {
  return http.post(`/draw-api/auth/login?phone=${phone}&code=${code}`)
}

// 获取用户信息
export const getInfoApi = () => {
  return http.get('/draw-api/user/info')
}

// 登出接口
export const logoutApi = () => {
  return http.post('/draw-api/auth/logout')
}
