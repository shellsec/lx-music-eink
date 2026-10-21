import settingState from '@/store/setting/state'
import { state } from '@/store/userApi'
import { setUserApi } from '@/core/userApi'
import { refreshSubscriptionAfterFailure } from '@/core/sourceSubscription'

export const USER_API_AUTO_ID = 'user_api_auto'
let loadedId = ''
export const setLoadedUserApiId = (id: string) => { loadedId = id }
export const isAutoApiSource = () => settingState.setting['common.apiSource'] === USER_API_AUTO_ID

const loadImportedApi = async(id: string) => {
  if (!state.list.some(api => api.id === id)) throw new Error('source not imported')
  global.lx.apiInitPromise[0] = new Promise(resolve => {
    global.lx.apiInitPromise[1] = false
    global.lx.apiInitPromise[2] = result => {
      global.lx.apiInitPromise[1] = true
      resolve(result)
    }
  })
  loadedId = id
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await setUserApi(id)
    const ready = await Promise.race([
      global.lx.apiInitPromise[0],
      new Promise<boolean>(resolve => { timer = setTimeout(() => { resolve(false) }, 25000) }),
    ])
    if (!ready) throw new Error('source init failed')
    loadedId = id
  } catch (error) {
    if (!global.lx.apiInitPromise[1]) global.lx.apiInitPromise[2](false)
    throw error
  } finally { clearTimeout(timer) }
}

export const activateAutoUserApi = async() => {
  const first = state.list[0]
  if (!first) throw new Error('请在设置中导入自定义源')
  await loadImportedApi(first.id)
}

const tryImportedSources = async(
  tryOnce: () => Promise<{ url: string, type: LX.Quality }>,
  current: string,
): Promise<{ url: string, type: LX.Quality }> => {
  if (!isAutoApiSource()) throw new Error('automatic switching disabled')
  let lastError: unknown = new Error('all imported sources failed')
  for (const api of [...state.list]) {
    if (!isAutoApiSource()) throw new Error('automatic switching disabled')
    if (api.id === current) continue
    try {
      await loadImportedApi(api.id)
      const result = await tryOnce()
      if (!result.url || !/^https?:\/\//i.test(result.url)) throw new Error('invalid music url')
      return result
    } catch (error) { lastError = error }
  }
  throw lastError
}

export const buildMusicFailoverKey = (music: LX.Music.MusicInfoOnline) => `${music.source}:${music.id}`

export const tryUserApiFailover = async(
  tryOnce: () => Promise<{ url: string, type: LX.Quality }>,
  songKey = 'current',
): Promise<{ url: string, type: LX.Quality }> => {
  try {
    return await tryImportedSources(tryOnce, loadedId)
  } catch (error) {
    if (!isAutoApiSource()) throw error
    let changed = false
    try { changed = await refreshSubscriptionAfterFailure(songKey) } catch (refreshError) {
      console.log('[subscription]', refreshError)
    }
    if (!changed || !isAutoApiSource()) throw error
    // A changed snapshot gets exactly one complete pass, including the previous source.
    return tryImportedSources(tryOnce, '')
  }
}
