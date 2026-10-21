import settingState from '@/store/setting/state'
import { state } from '@/store/userApi'
import { updateSetting } from '@/core/common'
import { setUserApiList } from '@/core/userApi'
import { applyUserApiSubscription } from '@/utils/data'
import { saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'

const AUTO_CHECK_INTERVAL = 5 * 60 * 1000
const checkedSongs = new Set<string>()
let lastCheck: { address: string, time: number } | null = null
let inFlight: { address: string, promise: Promise<boolean> } | null = null

export const saveSubscriptionAddress = async(value: string) => {
  const address = value.trim()
  if (address && !/^https:\/\/[^\s]+$/i.test(address)) throw new Error('请输入有效的 HTTPS 订阅地址')
  updateSetting({ 'common.sourceSubscriptionUrl': address })
  await saveData(storageDataPrefix.setting, settingState.setting)
}

const fetchText = async(url: string, maxLength: number) => {
  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, 15000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    if (text.length > maxLength) throw new Error('订阅内容过大')
    return text
  } finally { clearTimeout(timer) }
}

const synchronize = async(address: string) => {
  const data: unknown = JSON.parse(await fetchText(address, 1_000_000))
  const manifest = data as { sources?: unknown, version?: unknown }
  const raw: unknown = Array.isArray(data) ? data : manifest?.sources
  if (!Array.isArray(raw) || raw.length > 20) throw new Error('无效的 sources.json 清单')
  const ids = new Set<string>()
  const sources = raw.map((value: unknown) => {
    const item = value as { id?: unknown, name?: unknown, url?: unknown }
    if (typeof item?.id !== 'string' || typeof item.name !== 'string' || typeof item.url !== 'string') {
      throw new Error('清单条目须包含 id、name、url')
    }
    const id = item.id.trim()
    const name = item.name.trim()
    const url = item.url.trim()
    if (!id || !name || !/^https:\/\/[^\s]+$/i.test(url) || ids.has(id)) throw new Error('无效或重复的清单条目')
    ids.add(id)
    return { id, name, url }
  })
  const signature = JSON.stringify({ version: manifest?.version ?? '', sources })
  const scripts = await Promise.all(sources.map(async source => ({ ...source, script: await fetchText(source.url, 9_000_000) })))
  if (settingState.setting['common.sourceSubscriptionUrl'] !== address) throw new Error('订阅地址已变更，本次更新已取消')
  const result = await applyUserApiSubscription(address, signature, scripts)
  if (result.changed) setUserApiList(result.list)
  return result.changed
}

/** Manual refresh can bootstrap an empty list; startup never requests a subscription. */
export const refreshSubscription = async(): Promise<boolean> => {
  const address = settingState.setting['common.sourceSubscriptionUrl']
  if (!address) return false
  if (inFlight) return inFlight.address === address ? inFlight.promise : false
  lastCheck = { address, time: Date.now() }
  const promise = synchronize(address)
  inFlight = { address, promise }
  try { return await promise } finally {
    if (inFlight?.promise === promise) inFlight = null
  }
}

/** One check per song/address in this session, with a shared cooldown across songs. */
export const refreshSubscriptionAfterFailure = async(songKey: string): Promise<boolean> => {
  const address = settingState.setting['common.sourceSubscriptionUrl']
  if (!address || !state.list.length) return false
  const key = JSON.stringify([address, songKey])
  if (checkedSongs.has(key)) return false
  if (inFlight) {
    if (inFlight.address !== address) return false
    checkedSongs.add(key)
    return inFlight.promise
  }
  if (lastCheck?.address === address && Date.now() - lastCheck.time < AUTO_CHECK_INTERVAL) return false
  checkedSongs.add(key)
  return refreshSubscription()
}
