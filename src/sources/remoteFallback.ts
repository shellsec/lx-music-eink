import {
  buildNextCatalog,
  getLocalCatalog,
  type RemoteSourceItem,
} from '@/sources/catalogState'
import { replaceLocalCatalog } from '@/sources/builtin/ensure'

export const REMOTE_SOURCES_JSON_URL = 'https://gh-proxy.com/raw.githubusercontent.com/shellsec/lx-music-source/master/sources.json'

const fetchText = (url: string, timeoutMs = 12000) => new Promise<string>((resolve, reject) => {
  const timer = setTimeout(() => { reject(new Error('timeout')) }, timeoutMs)
  fetch(url).then(async res => {
    if (!res.ok) throw new Error(String(res.status))
    return res.text()
  }).then(text => {
    clearTimeout(timer)
    resolve(text)
  }, err => {
    clearTimeout(timer)
    reject(err)
  })
})

const parseSources = (text: string): RemoteSourceItem[] => {
  const data = JSON.parse(text) as { sources?: RemoteSourceItem[] }
  if (!Array.isArray(data?.sources)) throw new Error('invalid sources.json')
  return data.sources.map(item => ({
    id: String(item?.id ?? '').trim(),
    name: String(item?.name ?? '').trim(),
    url: String(item?.url ?? '').trim(),
  })).filter(item => item.id && /^https:\/\//i.test(item.url))
}

/**
 * 当前这首歌的本地音源全部失败后调用一次。
 * 名单和脚本都没变，或远程取不到：返回 false，调用方停止，不再请求。
 */
export const refreshSourcesIfChanged = async(): Promise<boolean> => {
  const prev = getLocalCatalog()
  if (!prev?.length) return false

  let remote: RemoteSourceItem[]
  try {
    remote = parseSources(await fetchText(REMOTE_SOURCES_JSON_URL))
  } catch (err) {
    console.log('[userApi fallback] sources.json unavailable', err)
    return false
  }
  if (!remote.length) return false

  const fetched: Record<string, string | null> = {}
  await Promise.all(remote.map(async item => {
    try {
      fetched[item.id] = await fetchText(item.url, 20000)
    } catch {
      fetched[item.id] = null
    }
  }))

  const { next, scriptsToSave, changed } = buildNextCatalog(prev, remote, fetched)
  if (!changed) {
    console.log('[userApi fallback] remote list unchanged')
    return false
  }
  await replaceLocalCatalog(next, scriptsToSave)
  console.log('[userApi fallback] local list updated', next.map(item => item.key).join(','))
  return true
}
