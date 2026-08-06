import { router } from '@inertiajs/react'
import { http } from '@/lib/http'

/**
 * 与原始 bundle 的 Et（Inertia router）兼容的封装
 * - get/post/put/delete 走 Inertia 页面访问
 * - postJson/putJson/deleteJson 走 axios JSON API
 */
export const api = {
  /** Inertia 页面访问（后端返回 Inertia page JSON 或 HTML） */
  get: (url: string, data?: Record<string, any>, opts?: any) => router.get(url, data, opts),
  post: (url: string, data?: Record<string, any>, opts?: any) => router.post(url, data, opts),
  put: (url: string, data?: Record<string, any>, opts?: any) => router.put(url, data, opts),
  delete: (url: string, opts?: any) => router.delete(url, opts),
  /** JSON API */
  postJson: (url: string, body?: any, opts?: any) => http.post(url, body, opts),
  putJson: (url: string, body?: any, opts?: any) => http.put(url, body, opts),
  deleteJson: (url: string, opts?: any) => http.delete(url, opts),
}
