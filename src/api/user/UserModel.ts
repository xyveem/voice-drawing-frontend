// 登录参数
export type LoginParm = {
  phone: string
  code: string
}

// 登录返回
export type LoginResult = {
  userId: number
  phone: string
  accessToken: string
}

// 用户信息
export type UserInfo = {
  userId: number
  phone: string
  nickname: string
  avatar: string
}
