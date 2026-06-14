import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getInfoApi } from '@/api/user'

export const useUserStore = defineStore('userStore', () => {
  const id = ref('')
  const nickName = ref('')
  const token = ref('')
  const avatar = ref('')

  const setUserId = (newUserId: string) => {
    id.value = newUserId
  }

  const setNickName = (newNickName: string) => {
    nickName.value = newNickName
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const getInfo = async () => {
    try {
      const res = await getInfoApi()
      if (res.code === 0) {
        nickName.value = res.data.nickname || ''
        avatar.value = res.data.avatar || ''
        id.value = res.data.id
        console.log('用户ID：', id.value)
        console.log('昵称：', nickName.value)
        console.log('头像：', avatar.value)
        console.log('token：', token.value)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const logout = () => {
    id.value = ''
    nickName.value = ''
    token.value = ''
    avatar.value = ''
    localStorage.removeItem('token')
  }

  // 初始化：从 localStorage 恢复 token
  const init = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
    }
  }
  init()

  return {
    id,
    nickName,
    token,
    avatar,
    setUserId,
    setNickName,
    setToken,
    getInfo,
    logout,
    init
  }
})
