import { state } from '@/store/userApi'
import settingState from '@/store/setting/state'
import { importUserApi } from '@/core/userApi'
import { saveSubscriptionAddress } from '@/core/sourceSubscription'

interface WebResult {
  status: number
  data: { message?: string, subscriptionUrl?: string, sources?: string[] }
}

/** The same import and storage path used by the on-device controls. */
export const handleSourceWebRequest = async(body: string): Promise<WebResult> => {
  try {
    const input: unknown = JSON.parse(body)
    if (!input || typeof input !== 'object') throw new Error('无效的请求')
    const request = input as { action?: unknown, value?: unknown }
    if (request.action === 'status') {
      return {
        status: 200,
        data: {
          subscriptionUrl: settingState.setting['common.sourceSubscriptionUrl'],
          sources: state.list.map(source => source.name),
        },
      }
    }
    if (typeof request.value !== 'string') throw new Error('请填写内容')
    const value = request.value.trim()
    if (request.action === 'subscription') {
      if (value.length > 4096) throw new Error('订阅地址过长')
      await saveSubscriptionAddress(value)
      return { status: 200, data: { message: value ? '订阅地址已保存到设备' : '订阅已关闭' } }
    }
    if (request.action !== 'importUrl' && request.action !== 'importScript') throw new Error('未知的操作')
    if (state.list.length >= 20) throw new Error('最多只能导入 20 个自定义源')
    let script = value
    if (request.action === 'importUrl') {
      if (value.length > 4096 || !/^https?:\/\/[^\s]+$/i.test(value)) throw new Error('请输入有效的 HTTP 或 HTTPS 音源链接')
      const controller = new AbortController()
      const timer = setTimeout(() => { controller.abort() }, 15000)
      try {
        const response = await fetch(value, { signal: controller.signal })
        if (!response.ok) throw new Error(`下载失败：HTTP ${response.status}`)
        script = await response.text()
      } finally { clearTimeout(timer) }
    }
    if (script.length > 9_000_000 || !/^\/\*[\S|\s]+?\*\//.test(script)) throw new Error('无效的自定义源文件，最大 9 MB')
    await importUserApi(script)
    return { status: 200, data: { message: '已导入到设备，请在设备上选择源或启用多源自动切换' } }
  } catch (error: unknown) {
    return { status: 400, data: { message: error instanceof Error ? error.message : String(error) } }
  }
}
