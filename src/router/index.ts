import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/',
      name: 'index',
      component: () => import('@/views/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pictureList',
      name: 'pictureList',
      component: () => import('@/views/pictureList.vue'),
      meta: { requiresAuth: true } // 画廊也需要登录
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const userStore = useUserStore()

  // 如果有 token 但没有用户信息，尝试获取
  if (token && !userStore.nickName) {
    try {
      await userStore.getInfo()
    } catch (error) {
      // 获取失败，清除 token
      localStorage.removeItem('token')
      userStore.logout()
    }
  }

  // 需要登录但无 token，跳转登录页
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  // 已登录访问登录页，跳转首页
  if (to.path === '/login' && token) {
    next('/')
    return
  }

  next()
})

export default router
