import { storageDataPrefix } from '@/config/constant'
import { getData, saveData } from '@/plugins/storage'
import {
  BUILTIN_USER_APIS,
  BUILTIN_USER_API_IDS,
  USER_API_AUTO_ID,
  getBuiltinScript,
  type BuiltinUserApi,
} from './index'
import { getStoredUserApiScript, getUserApiList, saveBuiltinUserApi } from '@/utils/data'
import { setUserApiList } from '@/core/userApi'
import {
  getManagedSourceIds,
  hashScript,
  isManagedSourceId,
  setFallbackBuiltinIds,
  setLocalCatalog,
  type LocalSourceRecord,
  type ScriptToSave,
} from '@/sources/catalogState'

export { USER_API_AUTO_ID, BUILTIN_USER_APIS, BUILTIN_USER_API_IDS, getBuiltinScript }

const AUTO_INFO: LX.UserApi.UserApiInfo = {
  id: USER_API_AUTO_ID,
  name: '自动切换',
  description: '按序尝试内置自定义音源解析播放地址',
  author: 'lxwear',
  homepage: '',
  version: '1',
  allowShowUpdateAlert: false,
}

/** 最近一次成功解析的内置源 id（仅内存，重启后仍从列表头开始优先） */
let preferredBuiltinId: string | null = null
/** 当前实际已 loadScript 的内置源（auto 模式下不等于 setting 里的 user_api_auto） */
let loadedBuiltinId: string | null = null

setFallbackBuiltinIds(BUILTIN_USER_API_IDS)

export const getPreferredBuiltinId = () => preferredBuiltinId
export const setPreferredBuiltinId = (id: string | null) => {
  preferredBuiltinId = id && isManagedSourceId(id) ? id : null
}
export const getLoadedBuiltinId = () => loadedBuiltinId
export const setLoadedBuiltinId = (id: string | null) => {
  loadedBuiltinId = id
}

export const resolveInitialBuiltinId = (): string => {
  const ids = getManagedSourceIds()
  if (preferredBuiltinId && ids.includes(preferredBuiltinId)) return preferredBuiltinId
  return ids[0] ?? ''
}

/** 按「成功优先 → 其余按当前本地名单顺序」生成尝试队列 */
export const getBuiltinFailoverOrder = (exclude: string[] = []): string[] => {
  const ids = getManagedSourceIds().filter(id => !exclude.includes(id))
  if (!preferredBuiltinId || !ids.includes(preferredBuiltinId)) return ids
  return [preferredBuiltinId, ...ids.filter(id => id !== preferredBuiltinId)]
}

const toInfo = (item: Pick<LocalSourceRecord, 'id' | 'name' | 'author' | 'version'>): LX.UserApi.UserApiInfo => ({
  id: item.id,
  name: item.name,
  description: `内置 ${item.name}，用于解析播放地址`,
  author: item.author,
  homepage: '',
  version: item.version,
  allowShowUpdateAlert: false,
})

const publishUserApiList = async(catalog: LocalSourceRecord[]) => {
  const managed = new Set(catalog.map(item => item.id))
  const deprecatedIds = new Set(['user_api_builtin_xinghai', 'user_api_flower_builtin'])
  const current = await getUserApiList()
  const extras = current.filter(item => (
    item.id !== USER_API_AUTO_ID && !managed.has(item.id) && !deprecatedIds.has(item.id)
  ))
  const list = [AUTO_INFO, ...catalog.map(toInfo), ...extras]
  await saveData(storageDataPrefix.userApi, list)
  setUserApiList(list)
  return list
}

const recordFromBuiltin = (api: BuiltinUserApi, script: string): LocalSourceRecord => ({
  key: api.key,
  id: api.id,
  name: api.name,
  url: api.url,
  author: api.author,
  version: api.version,
  scriptHash: hashScript(script),
})

/**
 * 没有本地名单时写入打包的内置音源。已有本地脚本不覆盖，也不访问远程。
 */
export const ensureBuiltinUserApis = async(): Promise<LX.UserApi.UserApiInfo[]> => {
  await getUserApiList()
  let catalog = await getData<LocalSourceRecord[]>(storageDataPrefix.userApiCatalog)
  if (!catalog?.length) {
    catalog = []
    for (const api of BUILTIN_USER_APIS) {
      const stored = await getStoredUserApiScript(api.id)
      const script = stored || api.script
      if (!stored && api.script) await saveBuiltinUserApi(toInfo(api), api.script)
      catalog.push(recordFromBuiltin(api, script))
    }
    await saveData(storageDataPrefix.userApiCatalog, catalog)
  } else {
    let dirty = false
    for (const item of catalog) {
      const stored = await getStoredUserApiScript(item.id)
      if (stored) continue
      const bundled = getBuiltinScript(item.id)
      if (!bundled) continue
      await saveBuiltinUserApi(toInfo(item), bundled)
      item.scriptHash = hashScript(bundled)
      dirty = true
    }
    if (dirty) await saveData(storageDataPrefix.userApiCatalog, catalog)
  }
  setLocalCatalog(catalog)
  return publishUserApiList(catalog)
}

/** 兜底确认名单或脚本变化后，写回本地名单与脚本。 */
export const replaceLocalCatalog = async(next: LocalSourceRecord[], scriptsToSave: ScriptToSave[]) => {
  await getUserApiList()
  for (const item of scriptsToSave) {
    const meta = next.find(source => source.id === item.id)
    if (!meta) continue
    await saveBuiltinUserApi(toInfo(meta), item.script)
  }
  setLocalCatalog(next)
  await saveData(storageDataPrefix.userApiCatalog, next)
  await publishUserApiList(next)
}

export const toBuiltinInfo = (api: BuiltinUserApi): LX.UserApi.UserApiInfo => toInfo(api)
