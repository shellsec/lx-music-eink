import { FLOWER_SCRIPT, FLOWER_USER_API_ID } from './script'
import { getUserApiList, saveBuiltinUserApi } from '@/utils/data'
import { setUserApiList } from '@/core/userApi'

export { FLOWER_SCRIPT, FLOWER_USER_API_ID }

/** Flower 内置音源元信息（与脚本头部 @name/@version 对齐） */
export const FLOWER_USER_API_INFO: LX.UserApi.UserApiInfo = {
  id: FLOWER_USER_API_ID,
  name: '野花',
  description: '内置 Flower 音源，用于解析播放地址',
  author: 'pdone',
  homepage: 'https://github.com/pdone/lx-music-source',
  version: '1',
  allowShowUpdateAlert: false,
}

/**
 * 确保 Flower 已写入本地自定义音源列表并作为可加载源。
 * 每次启动覆盖脚本内容，保证内置版本始终可用。
 */
export const ensureBuiltinFlowerApi = async(): Promise<LX.UserApi.UserApiInfo> => {
  await getUserApiList()
  const list = await saveBuiltinUserApi(FLOWER_USER_API_INFO, FLOWER_SCRIPT)
  setUserApiList(list)
  return FLOWER_USER_API_INFO
}
