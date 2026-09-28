/** 内置自定义音源清单（启动写入，失败时按序切换 musicUrl） */

export const USER_API_AUTO_ID = 'user_api_auto'

export interface BuiltinUserApi {
  key: string
  id: string
  name: string
  author: string
  version: string
  script: string
}

export const BUILTIN_USER_APIS: BuiltinUserApi[] = [
]

export const BUILTIN_USER_API_IDS = BUILTIN_USER_APIS.map((a) => a.id)

export const getBuiltinScript = (id: string) => BUILTIN_USER_APIS.find((a) => a.id === id)?.script ?? ''

export const isBuiltinUserApiId = (id: string) => id === USER_API_AUTO_ID || BUILTIN_USER_API_IDS.includes(id)
