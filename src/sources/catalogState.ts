/** 本地音源名单。远程 sources.json 只在全部失败后的兜底里比较，不在启动时拉取。 */

export interface LocalSourceRecord {
  key: string
  id: string
  name: string
  url: string
  author: string
  version: string
  scriptHash: string
  /** sources.json 里的 version。没有这个字段时为空，不拿脚本注释冒充。 */
  sourceVersion?: string
}

export interface RemoteSourceItem {
  id: string
  name: string
  url: string
  hasVersion: boolean
  version: string
  inlineScript?: string
}

export interface ScriptToSave {
  id: string
  script: string
}

let localCatalog: LocalSourceRecord[] | null = null
let fallbackIds: string[] = []

export const setFallbackBuiltinIds = (ids: string[]) => {
  fallbackIds = ids.slice()
}

export const getLocalCatalog = () => localCatalog

export const setLocalCatalog = (list: LocalSourceRecord[]) => {
  localCatalog = list
}

export const getManagedSourceIds = () => (
  localCatalog?.length ? localCatalog.map(item => item.id) : fallbackIds
)

export const isManagedSourceId = (id: string) => getManagedSourceIds().includes(id)

export const toRuntimeSourceId = (key: string) => (
  key.startsWith('user_api_') ? key : `user_api_builtin_${key}`
)

/** 比较脚本正文时忽略 BOM、换行和末尾空白。 */
export const normalizeScript = (script: string) => script.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\s+$/u, '')

/** 稳定、可复现的脚本内容哈希（FNV-1a 双路 + 长度）。 */
export const hashScript = (script: string): string => {
  const text = normalizeScript(script)
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 0x01000193)
    h2 = Math.imul(h2 ^ (code >>> 8), 0x01000193)
  }
  return (h1 >>> 0).toString(16).padStart(8, '0')
    + (h2 >>> 0).toString(16).padStart(8, '0')
    + text.length.toString(16)
}

/** 地址、sources.json 的 version、脚本内容。名称不同不算名单变化。 */
export const sourceListSignature = (items: Array<Pick<LocalSourceRecord, 'key' | 'url' | 'scriptHash' | 'sourceVersion'>>) => (
  items.map(item => `${item.key}\u0001${item.url}\u0001${item.sourceVersion ?? ''}\u0001${item.scriptHash}`).join('\n')
)

export const claimOnce = (attempted: Set<string>, key: string) => {
  if (attempted.has(key)) return false
  attempted.add(key)
  return true
}

/**
 * 用远程 sources.json 的 id/名称/脚本 URL，以及拉到的脚本内容哈希，和本地名单比较。
 * 脚本没取到且 URL 未变时保留本地脚本；没有可应用的变化时 changed 为 false。
 */
export const buildNextCatalog = (
  prev: LocalSourceRecord[],
  remote: RemoteSourceItem[],
  fetched: Record<string, string | null>,
): { next: LocalSourceRecord[], scriptsToSave: ScriptToSave[], changed: boolean } => {
  if (!remote.length) return { next: prev, scriptsToSave: [], changed: false }
  const prevByKey = new Map(prev.map(item => [item.key, item]))
  const seen = new Set<string>()
  const next: LocalSourceRecord[] = []
  const scriptsToSave: ScriptToSave[] = []

  for (const item of remote) {
    const key = String(item.id || '').trim()
    const url = String(item.url || '').trim()
    const name = String(item.name || key).trim()
    if (!key || !url || seen.has(key)) continue
    seen.add(key)
    const id = toRuntimeSourceId(key)
    const old = prevByKey.get(key)
    const body = fetched[key]
    if (typeof body === 'string' && looksLikeScript(body)) {
      const scriptHash = hashScript(body)
      if (!old || old.scriptHash !== scriptHash) scriptsToSave.push({ id, script: body })
      next.push({
        key,
        id,
        name,
        url,
        author: old?.author || '',
        version: old?.version || '1',
        scriptHash,
      })
      continue
    }
    // 新脚本取不到时保留本地条目，避免把还没更新成功的音源从名单里删掉。
    if (old) next.push({ ...old, name })
  }

  if (!next.length) return { next: prev, scriptsToSave: [], changed: false }
  const changed = sourceListSignature(prev) !== sourceListSignature(next)
  return { next, scriptsToSave: changed ? scriptsToSave : [], changed }
}

const looksLikeScript = (body: string) => {
  const trimmed = body.trim()
  return trimmed.length > 20 && !trimmed.startsWith('<')
}
