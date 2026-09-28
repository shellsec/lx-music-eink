import versionActions from '@/store/version/action'
import versionState, { type InitState } from '@/store/version/state'
import { saveIgnoreVersion } from '@/utils/data'
import { showVersionModal } from '@/navigation'
import { Navigation } from 'react-native-navigation'
import { openUrl, toast } from '@/utils/tools'

/** 墨水屏 fork 的发布页，勿再指向上游 lyswhut/lx-music-mobile */
export const FORK_RELEASES_URL = 'https://github.com/shellsec/lx-music-eink/releases'

export const showModal = () => {
  if (versionState.showModal) return
  versionActions.setVisibleModal(true)
  showVersionModal()
}

export const hideModal = (componentId: string) => {
  if (!versionState.showModal) return
  versionActions.setVisibleModal(false)
  void Navigation.dismissOverlay(componentId)
}

/**
 * 墨水屏 fork：不再请求官方 version.json，也不弹「有新版本」。
 * 设置里的手动入口改打开本 fork Releases，见 Version.tsx。
 */
export const checkUpdate = async() => {
  versionActions.setVersionInfo({
    status: 'idle',
    isLatest: true,
    isUnknown: false,
  })
}

/** 禁用静默下载上游 APK，改为打开本 fork Releases */
export const downloadUpdate = () => {
  toast(global.i18n.t('version_tip_unknown'))
  void openUrl(FORK_RELEASES_URL)
}


export const setIgnoreVersion = (version: InitState['ignoreVersion']) => {
  versionActions.setIgnoreVersion(version)
  saveIgnoreVersion(version)
}
