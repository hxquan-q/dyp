import axios from 'axios'
import type { InertiaResponse } from '@/types'

/**
 * HTTP 客户端（对齐原始 bundle 的 zt 实例）
 * - 所有请求带 X-Requested-With: XMLHttpRequest
 * - Electron 环境自动附加 X-Koudanbao-Client + 设备头
 */
export const http = axios.create({
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

http.interceptors.request.use((config) => {
  const win = window as any
  if (win.electronAPI) {
    config.headers = config.headers ?? {}
    config.headers['X-Koudanbao-Client'] = 'electron'
  }
  return config
})

/** 读取后端 JSON 响应 { code:0, data } */
export async function getData<T>(url: string, params?: Record<string, any>): Promise<T> {
  const res = await http.get<InertiaResponse<T>>(url, { params })
  return res.data.data
}

/** POST 并返回 data */
export async function postData<T>(url: string, body?: Record<string, any>): Promise<T> {
  const res = await http.post<InertiaResponse<T>>(url, body)
  return res.data.data
}
