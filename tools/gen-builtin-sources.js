const fs = require('fs')
const path = require('path')

const dir = 'src/sources/scripts'
const outDir = 'src/sources/builtin'
fs.mkdirSync(outDir, { recursive: true })

const meta = {
  flower: { id: 'user_api_builtin_flower', name: '野花', author: 'pdone', version: '1' },
  sixyin: { id: 'user_api_builtin_sixyin', name: '六音', author: '六音', version: '1.2.1' },
  huibq: { id: 'user_api_builtin_huibq', name: 'Huibq', author: 'Huibq', version: '1.2.0' },
  ikun: { id: 'user_api_builtin_ikun', name: 'ikun', author: 'ikunshare', version: '22' },
  grass: { id: 'user_api_builtin_grass', name: '野草', author: 'pdone', version: '1' },
  juhe: { id: 'user_api_builtin_juhe', name: '综合API', author: 'lerd', version: '3' },
  qdy: { id: 'user_api_builtin_qdy', name: '全都要', author: '全都要', version: '9.3' },
}
const order = ['flower', 'sixyin', 'huibq', 'ikun', 'grass', 'juhe', 'qdy']

const entries = []
for (const key of order) {
  const scriptPath = path.join(dir, key + '.js')
  if (!fs.existsSync(scriptPath)) {
    console.log('MISSING', key)
    continue
  }
  const script = fs.readFileSync(scriptPath, 'utf8')
  const m = meta[key]
  const file = path.join(outDir, key + '.ts')
  fs.writeFileSync(
    file,
    [
      'export const id = ' + JSON.stringify(m.id),
      'export const name = ' + JSON.stringify(m.name),
      'export const author = ' + JSON.stringify(m.author),
      'export const version = ' + JSON.stringify(m.version),
      'export const script = ' + JSON.stringify(script),
      '',
    ].join('\n')
  )
  entries.push({ key, ...m })
  console.log('wrote', key, Math.round(script.length / 1024) + 'KB')
}

const lines = []
lines.push('/** 内置自定义音源清单（启动写入，失败时按序切换 musicUrl） */')
for (const e of entries) lines.push(`import * as ${e.key} from './${e.key}'`)
lines.push('')
lines.push("export const USER_API_AUTO_ID = 'user_api_auto'")
lines.push('')
lines.push('export interface BuiltinUserApi {')
lines.push('  key: string')
lines.push('  id: string')
lines.push('  name: string')
lines.push('  author: string')
lines.push('  version: string')
lines.push('  script: string')
lines.push('}')
lines.push('')
lines.push('export const BUILTIN_USER_APIS: BuiltinUserApi[] = [')
for (const e of entries) {
  lines.push(`  { key: '${e.key}', id: ${e.key}.id, name: ${e.key}.name, author: ${e.key}.author, version: ${e.key}.version, script: ${e.key}.script },`)
}
lines.push(']')
lines.push('')
lines.push('export const BUILTIN_USER_API_IDS = BUILTIN_USER_APIS.map((a) => a.id)')
lines.push('')
lines.push('export const getBuiltinScript = (id: string) => BUILTIN_USER_APIS.find((a) => a.id === id)?.script ?? \'\'')
lines.push('')
lines.push('export const isBuiltinUserApiId = (id: string) => id === USER_API_AUTO_ID || BUILTIN_USER_API_IDS.includes(id)')
lines.push('')

fs.writeFileSync(path.join(outDir, 'index.ts'), lines.join('\n'))
console.log('index ok', entries.length)
