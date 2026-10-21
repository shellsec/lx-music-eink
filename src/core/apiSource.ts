import { updateSetting } from './common'
import settingState from '@/store/setting/state'
import { destroyUserApi, setUserApi } from './userApi'
import { USER_API_AUTO_ID, setLoadedUserApiId, activateAutoUserApi } from './userApiFailover'

export const setApiSource = (apiId: string) => {
  if (global.lx.apiInitPromise[1]) {
    global.lx.apiInitPromise[0] = new Promise(resolve => {
      global.lx.apiInitPromise[1] = false
      global.lx.apiInitPromise[2] = (result: boolean) => {
        global.lx.apiInitPromise[1] = true
        resolve(result)
      }
    })
  }
  if (apiId !== settingState.setting['common.apiSource']) {
    updateSetting({ 'common.apiSource': apiId })
    requestAnimationFrame(() => { global.state_event.apiSourceUpdated(apiId) })
  }
  if (!apiId) {
    destroyUserApi()
    setLoadedUserApiId('')
    if (!global.lx.apiInitPromise[1]) global.lx.apiInitPromise[2](false)
    return
  }
  const loading = apiId === USER_API_AUTO_ID
    ? activateAutoUserApi()
    : setUserApi(apiId).then(() => { setLoadedUserApiId(apiId) })
  void loading.catch(error => {
    if (!global.lx.apiInitPromise[1]) global.lx.apiInitPromise[2](false)
    console.log(error)
  })
}
