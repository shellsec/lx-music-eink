import { NativeEventEmitter, NativeModules } from 'react-native'
import { handleSourceWebRequest } from '@/core/sourceWeb'
import { SOURCE_WEB_PAGE } from '@/core/sourceWebPage'
import { getWIFIIPV4Address } from './utils'

const native = NativeModules.SourceWebModule as {
  start: (host: string, page: string) => Promise<{ url: string, qrImage: string }>
  stop: () => Promise<void>
  respond: (id: string, status: number, body: string) => void
  addListener: (name: string) => void
  removeListeners: (count: number) => void
} | undefined

export const startSourceWeb = async(onStopped: () => void) => {
  if (!native) throw new Error('当前平台不支持 HTTP 网页配置')
  const host = await getWIFIIPV4Address()
  if (!host || host === '0.0.0.0') throw new Error('请连接 Wi-Fi 后再开启 HTTP 网页')
  const events = new NativeEventEmitter(native)
  const requests = events.addListener('source-web-request', (request: { id: string, body: string }) => {
    void handleSourceWebRequest(request.body).then(result => { native.respond(request.id, result.status, JSON.stringify(result.data)) })
  })
  const stopped = events.addListener('source-web-stopped', onStopped)
  const close = async() => {
    requests.remove()
    stopped.remove()
    await native.stop()
  }
  try {
    const info = await native.start(host, SOURCE_WEB_PAGE)
    return { ...info, close }
  } catch (error) { await close(); throw error }
}
