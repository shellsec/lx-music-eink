import { initSetting, showPactModal, updateSetting } from '@/core/common'
import registerPlaybackService from '@/plugins/player/service'
import initTheme from './theme'
import initI18n from './i18n'
import initUserApi from './userApi'
import initPlayer from './player'
import dataInit from './dataInit'
import initSync from './sync'
import initCommonState from './common'
import { initDeeplink } from './deeplink'
import { setApiSource } from '@/core/apiSource'
import commonActions from '@/store/common/action'
import settingState from '@/store/setting/state'
import { checkUpdate } from '@/core/version'
import { bootLog } from '@/utils/bootLog'
import { cheatTip } from '@/utils/tools'
import { USER_API_AUTO_ID } from '@/sources/builtin'
import { ensureBuiltinUserApis } from '@/sources/builtin/ensure'
import { ensureLocalMusicList } from '@/sources/localList'

let isFirstPush = true
const handlePushedHomeScreen = async() => {
  await cheatTip()
  if (settingState.setting['common.isAgreePact']) {
    if (isFirstPush) {
      isFirstPush = false
      void checkUpdate()
      void initDeeplink()
    }
  } else {
    if (isFirstPush) isFirstPush = false
    showPactModal()
  }
}

let isInited = false
export default async() => {
  if (isInited) return handlePushedHomeScreen
  bootLog('Initing...')
  commonActions.setFontSize(global.lx.fontSize)
  bootLog('Font size changed.')
  const setting = await initSetting()
  bootLog('Setting inited.')
  // console.log(setting)

  await initTheme(setting)
  bootLog('Theme inited.')
  await initI18n(setting)
  bootLog('I18n inited.')

  await initUserApi(setting)
  bootLog('User Api inited.')

  // 内置自定义音源 +「自动切换」：写入列表，默认走自动（原 userApi / musicUrl）
  await ensureBuiltinUserApis()
  const legacyFlowerId = 'user_api_flower_builtin'
  const apiSource = setting['common.apiSource']
  if (!apiSource || apiSource === legacyFlowerId || apiSource === 'user_api_builtin_xinghai') {
    updateSetting({ 'common.apiSource': USER_API_AUTO_ID })
    setting['common.apiSource'] = USER_API_AUTO_ID
  }
  bootLog('Builtin User Apis ensured.')

  setApiSource(setting['common.apiSource'])
  bootLog('Api inited.')

  registerPlaybackService()
  bootLog('Playback Service Registered.')
  await initPlayer(setting)
  bootLog('Player inited.')
  await dataInit(setting)
  bootLog('Data inited.')
  // 手表版「本地音乐」入口：预置空列表，用户可在「我的」里添加本地歌曲
  await ensureLocalMusicList()
  bootLog('Local music list ensured.')
  await initCommonState(setting)
  bootLog('Common State inited.')

  void initSync(setting)
  bootLog('Sync inited.')

  // syncSetting()

  isInited ||= true

  return handlePushedHomeScreen
}
