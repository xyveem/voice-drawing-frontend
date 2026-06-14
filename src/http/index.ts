import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'

const config = {
  baseURL: 'http://localhost:8080', // 改成后端端口
  timeout: 120000
}

export interface Result<T = unknown> {
  code: number
  msg: string
  data: T
}

class Http {
  private instance: AxiosInstance

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)
    this.interceptors()
  }

  private interceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 从 localStorage 获取 token，传给后端 Authorization 头
        const token = localStorage.getItem('token') || ''
        if (token) {
          config.headers['Authorization'] = `${token}`
        }
        return config
      },
      (error: unknown) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        // 后端成功 code 是 0，不是 200
        if (res.data.code === 0) {
          return res.data
        } else {
          ElMessage.error(res.data.msg || '服务器出错!')
          return Promise.reject(res.data.msg || '服务器出错')
        }
      },
      (error) => {
        if (error.response?.status === 401) {
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else {
          ElMessage.error(error.response?.data?.msg || '网络错误')
        }
        return Promise.reject(error)
      }
    )
  }

  get<T = Result>(url: string, params?: object): Promise<T> {
    return this.instance.get(url, { params })
  }

  post<T = Result>(url: string, data?: object): Promise<T> {
    return this.instance.post(url, data)
  }

  delete<T = Result>(url: string, data?: object): Promise<T> {
    return this.instance.delete(url, { data })
  }
}

export default new Http(config)
