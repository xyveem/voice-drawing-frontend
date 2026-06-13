import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getInfoApi } from '@/api/user'

export const useUserStore = defineStore(
  'userStore',
  () => {
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
    }

    const getInfo = async () => {
      try {
        const res = await getInfoApi()
        if (res.code === 0) {
          nickName.value = res.data.nickname || ''
          avatar.value = res.data.avatar || ''
          console.log('用户信息:', res.data)
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

    return {
      id,
      nickName,
      token,
      avatar,
      setUserId,
      setNickName,
      setToken,
      getInfo,
      logout
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'userInfo',
          storage: localStorage
        }
      ]
    }
  }
)
