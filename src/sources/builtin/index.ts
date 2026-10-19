/** 内置自定义音源清单（打包进客户端；失败时按序切换 musicUrl） */
import * as grass from './grass'
import * as appx64 from './appx64'
import * as flower from './flower'
import * as sixyin from './sixyin'
import * as huibq from './huibq'
import * as lx from './lx'
import * as ikun from './ikun'
import * as juhe from './juhe'
import * as qdy from './qdy'

export const USER_API_AUTO_ID = 'user_api_auto'

export interface BuiltinUserApi {
  key: string
  id: string
  name: string
  author: string
  version: string
  url: string
  script: string
}

export const BUILTIN_USER_APIS: BuiltinUserApi[] = [
  { key: 'grass', id: grass.id, name: grass.name, author: grass.author, version: grass.version, url: grass.url, script: grass.script },
  { key: 'appx64', id: appx64.id, name: appx64.name, author: appx64.author, version: appx64.version, url: appx64.url, script: appx64.script },
  { key: 'flower', id: flower.id, name: flower.name, author: flower.author, version: flower.version, url: flower.url, script: flower.script },
  { key: 'sixyin', id: sixyin.id, name: sixyin.name, author: sixyin.author, version: sixyin.version, url: sixyin.url, script: sixyin.script },
  { key: 'huibq', id: huibq.id, name: huibq.name, author: huibq.author, version: huibq.version, url: huibq.url, script: huibq.script },
  { key: 'lx', id: lx.id, name: lx.name, author: lx.author, version: lx.version, url: lx.url, script: lx.script },
  { key: 'ikun', id: ikun.id, name: ikun.name, author: ikun.author, version: ikun.version, url: ikun.url, script: ikun.script },
  { key: 'juhe', id: juhe.id, name: juhe.name, author: juhe.author, version: juhe.version, url: juhe.url, script: juhe.script },
  { key: 'qdy', id: qdy.id, name: qdy.name, author: qdy.author, version: qdy.version, url: qdy.url, script: qdy.script },
]

export const BUILTIN_USER_API_IDS = BUILTIN_USER_APIS.map((a) => a.id)

export const getBuiltinScript = (id: string) => BUILTIN_USER_APIS.find((a) => a.id === id)?.script ?? ''

export const isBuiltinUserApiId = (id: string) => id === USER_API_AUTO_ID || BUILTIN_USER_API_IDS.includes(id)
