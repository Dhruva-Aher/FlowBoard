import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // for httponly refresh cookie
})

// Attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const resp = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        const newToken = resp.data.access_token
        useAuthStore.getState().setAccessToken(newToken)
        failedQueue.forEach((p) => p.resolve(newToken))
        failedQueue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        failedQueue.forEach((p) => p.reject(refreshError))
        failedQueue = []
        useAuthStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
