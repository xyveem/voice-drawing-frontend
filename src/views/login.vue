<template>
  <div class="page-bg">
    <div class="login-container">
      <div class="login-section">
        <h2>手机号登录</h2>

        <el-form
          class="login-form"
          :model="loginModel"
          ref="formRef"
          :rules="rules"
          size="large"
        >
          <el-form-item prop="phone">
            <el-input
              v-model="loginModel.phone"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </el-form-item>

          <el-form-item prop="code">
            <div class="code-row">
              <el-input
                v-model="loginModel.code"
                placeholder="请输入验证码"
                maxlength="4"
              />
              <el-button
                type="primary"
                :disabled="countdown > 0"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-button type="primary" class="btn-login" @click="commit">
            登录
          </el-button>
        </el-form>
      </div>
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

// 表单校验规则
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

// 发送验证码
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

// 登录提交
const commit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return

    try {
      const res = await loginApi(loginModel.phone, loginModel.code)
      if (res.code === 0) {
        ElMessage.success('登录成功')

        // 保存 token
        localStorage.setItem('token', res.data.accessToken)
        store.setToken(res.data.accessToken)
        store.setUserId(String(res.data.userId))

        // 获取用户信息
        await store.getInfo()

        // 跳转首页
        router.push('/')
      }
    } catch (err) {
      console.error(err)
    }
  })
}
</script>

<style scoped lang="scss">
.page-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-container {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
}

.code-row {
  display: flex;
  gap: 10px;

  .el-input {
    flex: 1;
  }
}

.btn-login {
  width: 100%;
  margin-top: 20px;
}
</style>
