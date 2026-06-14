<template>
  <div class="page-bg">
    <div class="login-container">
      <div class="logo-section">
        <div class="logo-icon">🎨✨</div>
        <h1>声绘画廊</h1>
        <p>语音 · 绘画 · 创作</p>
      </div>

      <el-form
        class="login-form"
        :model="loginModel"
        ref="formRef"
        :rules="rules"
        size="large"
      >
        <div class="form-group">
          <div class="input-label">手机号</div>
          <div class="phone-input-wrapper">
            <span class="phone-prefix">+86</span>
            <el-form-item prop="phone" style="flex: 1; margin-bottom: 0">
              <el-input
                v-model="loginModel.phone"
                placeholder="请输入手机号"
                maxlength="11"
              />
            </el-form-item>
          </div>
        </div>

        <div class="form-group">
          <div class="input-label">验证码</div>
          <div class="captcha-row">
            <el-form-item prop="code" style="flex: 1; margin-bottom: 0">
              <el-input
                v-model="loginModel.code"
                placeholder="请输入验证码"
                maxlength="4"
              />
            </el-form-item>
            <el-button
              class="get-code-btn"
              :disabled="countdown > 0"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </div>

        <el-button type="primary" class="login-btn" @click="commit">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, FormInstance } from 'element-plus'
import { reactive, ref } from 'vue'
import { sendSmsApi, loginApi } from '@/api/user/index'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useUserStore()
const formRef = ref<FormInstance>()

const loginModel = reactive({
  phone: '',
  code: ''
})

const countdown = ref(0)

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码为4位', trigger: 'blur' }
  ]
}

const sendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(loginModel.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  try {
    await sendSmsApi(loginModel.phone)
    ElMessage.success('验证码已发送')

    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (err) {
    console.error(err)
  }
}

const commit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return

    try {
      const res = await loginApi(loginModel.phone, loginModel.code)
      if (res.code === 0) {
        ElMessage.success('登录成功')
        localStorage.setItem('token', res.data.accessToken)
        store.setToken(res.data.accessToken)
        store.setUserId(String(res.data.userId))
        await store.getInfo()
        router.push('/')
      }
    } catch (err) {
      console.error(err)
    }
  })
}
</script>

<style scoped lang="scss">
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.page-bg {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #faf7f2;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden !important;
  margin: 0;
  position: fixed;
  top: 0;
  left: 0;
}

.login-container {
  max-width: 480px;
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  border-radius: 48px;
  padding: 48px 40px 56px;
  box-shadow:
    0 25px 45px -12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(212, 165, 116, 0.15);
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.logo-section h1 {
  font-size: 1.8rem;
  font-weight: 500;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #d4a574 0%, #b8895c 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.logo-section p {
  font-size: 0.85rem;
  color: #9e9e9e;
  margin-top: 8px;
}

.form-group {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #5c5c5c;
  margin-bottom: 8px;
}

.phone-input-wrapper {
  display: flex;
  gap: 12px;
}

.phone-prefix {
  background: #f5f0ea;
  border: 1px solid #efe5db;
  border-radius: 60px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: #2c2c2c;
  font-weight: 450;
}

.captcha-row {
  display: flex;
  gap: 12px;
}

.get-code-btn {
  background: #ffffff;
  border: 1px solid #efe5db;
  border-radius: 60px;
  padding: 0 20px;
  font-size: 0.8rem;
  font-weight: 450;
  color: #d4a574;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.get-code-btn:hover {
  background: #fff9f2;
  border-color: #d4a574;
  color: #d4a574;
}

.get-code-btn:disabled {
  color: #c6c6c6;
  cursor: not-allowed;
  background: #f9f6f0;
}

.login-btn {
  width: 100%;
  background: #d4a574;
  border: none;
  border-radius: 60px;
  padding: 14px;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 8px;
}

.login-btn:hover {
  background: #c08e5e;
}

:deep(.el-input__wrapper) {
  border-radius: 60px;
  padding: 2px 20px;
  box-shadow: 0 0 0 1px #efe5db inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #d4a574 inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #d4a574 inset;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
