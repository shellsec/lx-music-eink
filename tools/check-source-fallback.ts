import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { buildNextCatalog, claimOnce, hashScript, type LocalSourceRecord } from '../src/sources/catalogState.ts'

const assert = (cond: boolean, message: string) => {
  if (!cond) throw new Error(message)
}

const base = (patch: Partial<LocalSourceRecord> = {}): LocalSourceRecord => ({
  key: 'grass',
  id: 'user_api_builtin_grass',
  name: '野草',
  url: 'https://example.com/grass.js',
  author: 'pdone',
  version: '1',
  scriptHash: hashScript('local-script-body-aaaa'),
  ...patch,
})

const same = buildNextCatalog(
  [base()],
  [{ id: 'grass', name: '野草', url: 'https://example.com/grass.js' }],
  { grass: 'local-script-body-aaaa' },
)
assert(same.changed === false, '相同名单和脚本不应视为变化')
assert(same.scriptsToSave.length === 0, '没变化时不应写脚本')

const renamed = buildNextCatalog(
  [base()],
  [{ id: 'grass', name: '野草新', url: 'https://example.com/grass.js' }],
  { grass: 'local-script-body-aaaa' },
)
assert(renamed.changed === true, '名称变化应更新名单')
assert(renamed.scriptsToSave.length === 0, '仅名称变化不必重写相同脚本')

const scriptChanged = buildNextCatalog(
  [base()],
  [{ id: 'grass', name: '野草', url: 'https://example.com/grass.js' }],
  { grass: 'remote-script-body-bbbb' },
)
assert(scriptChanged.changed === true, '脚本哈希变化应更新')
assert(scriptChanged.scriptsToSave.length === 1, '脚本变化应保存新脚本')
assert(scriptChanged.next[0]?.scriptHash === hashScript('remote-script-body-bbbb'), '新哈希应写入名单')

const unavailable = buildNextCatalog(
  [base()],
  [{ id: 'grass', name: '野草', url: 'https://example.com/grass.js' }],
  { grass: null },
)
assert(unavailable.changed === false, '脚本取不到且名单未变时应停止')

const urlFailed = buildNextCatalog(
  [base()],
  [{ id: 'grass', name: '野草', url: 'https://example.com/grass-v2.js' }],
  { grass: null },
)
assert(urlFailed.changed === false, '新脚本取不到时不要用空名单替换本地')
assert(urlFailed.next[0]?.url === base().url, '取不到新脚本时保留本地 URL')

const attempted = new Set<string>()
assert(claimOnce(attempted, 'kw:1') === true, '第一首歌可以请求一次兜底')
assert(claimOnce(attempted, 'kw:1') === false, '同一首不应再次请求')
assert(claimOnce(attempted, 'kw:2') === true, '下一首全部失败后可以再请求一次')

const builtinDir = join('src', 'sources', 'builtin')
const keys = ['grass', 'appx64', 'flower', 'sixyin', 'huibq', 'lx', 'ikun', 'juhe', 'qdy']
const names = ['野草', 'Appx64 Clear Music', '野花', '六音', 'Huibq', 'LX', 'ikun', '聚合', '全豆要']
keys.forEach((key, index) => {
  const text = readFileSync(join(builtinDir, `${key}.ts`), 'utf8')
  assert(text.includes(`export const name = ${JSON.stringify(names[index])}`), `${key} 名称不对`)
  assert(/export const url = "https:\/\//.test(text), `${key} 缺少脚本 URL`)
  assert(text.includes('export const script = '), `${key} 脚本未打包`)
})

const srcFiles = readdirSync('src', { recursive: true }) as string[]
const hits: string[] = []
for (const file of srcFiles) {
  if (!/\.(ts|tsx|js)$/.test(file)) continue
  const full = join('src', file)
  const text = readFileSync(full, 'utf8')
  if (!text.includes('shellsec/lx-music-source/master/sources.json')) continue
  hits.push(file.replace(/\\/g, '/'))
}
assert(hits.length === 1 && hits[0] === 'sources/remoteFallback.ts', `sources.json 调用点异常: ${hits.join(',')}`)
const failover = readFileSync('src/core/userApiFailover.ts', 'utf8')
assert(failover.includes('tryLocalSources'), '应先走本地名单')
assert(failover.indexOf('tryLocalSources') < failover.indexOf('refreshSourcesIfChanged'), '远程兜底必须在本地全部失败之后')
assert(!readFileSync('src/sources/builtin/ensure.ts', 'utf8').includes('refreshSourcesIfChanged'), '启动确保本地名单时不能拉远程')
assert(!readFileSync('src/core/apiSource.ts', 'utf8').includes('sources.json'), '换源不能请求 sources.json')
assert(!readFileSync('src/screens/Home/Views/Setting/settings/Basic/Source.tsx', 'utf8').includes('sources.json'), '音源管理不能请求 sources.json')

console.log('source fallback checks ok')
