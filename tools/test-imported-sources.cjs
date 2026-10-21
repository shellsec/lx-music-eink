const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const setting = { setting: { 'common.apiSource': 'user_api_auto' } }
const state = { list: [] }
const loaded = []
let initFailure = ''
let loadThrows = ''
const lx = { apiInitPromise: [Promise.resolve(false), true, () => {}] }
const moduleResult = { exports: {} }
const code = ts.transpileModule(fs.readFileSync('src/core/userApiFailover.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
vm.runInNewContext(code, {
  exports: moduleResult.exports,
  require: name => {
    if (name === '@/store/setting/state') return { default: setting }
    if (name === '@/store/userApi') return { state }
    if (name === '@/core/sourceSubscription') return { refreshSubscriptionAfterFailure: async () => false }
    if (name === '@/core/userApi') return { setUserApi: async id => {
      loaded.push(id)
      if (id === loadThrows) throw new Error('load failed')
      lx.apiInitPromise[2](id !== initFailure)
    } }
    throw new Error(`Unexpected dependency: ${name}`)
  },
  global: { lx }, setTimeout, clearTimeout,
})
const api = moduleResult.exports
;(async () => {
  await assert.rejects(api.activateAutoUserApi(), /请在设置中导入自定义源/)
  state.list = [{ id: 'local_a' }, { id: 'local_b' }, { id: 'local_c' }]
  await api.activateAutoUserApi()
  assert.deepEqual(loaded.splice(0), ['local_a'])
  initFailure = 'local_b'
  const result = await api.tryUserApiFailover(async () => ({ url: 'https://example.com/test.mp3', type: '128k' }))
  assert.equal(result.url, 'https://example.com/test.mp3')
  assert.deepEqual(loaded.splice(0), ['local_b', 'local_c'])
  initFailure = ''
  api.setLoadedUserApiId('local_b')
  await assert.rejects(api.tryUserApiFailover(async () => { throw new Error('unavailable') }), /unavailable/)
  assert.deepEqual(loaded.splice(0), ['local_a', 'local_c'])
  api.setLoadedUserApiId('local_a')
  loadThrows = 'local_c'
  initFailure = 'local_b'
  await assert.rejects(api.tryUserApiFailover(async () => { throw new Error('unavailable') }), /load failed/)
  assert.equal(lx.apiInitPromise[1], true)
  assert.equal(await lx.apiInitPromise[0], false)
  assert.deepEqual(loaded.splice(0), ['local_b', 'local_c'])
  setting.setting['common.apiSource'] = 'local_a'
  await assert.rejects(api.tryUserApiFailover(async () => { throw new Error('must not run') }), /disabled/)
  assert.deepEqual(loaded, [])
  state.list = []
  setting.setting['common.apiSource'] = 'user_api_auto'
  await assert.rejects(api.tryUserApiFailover(async () => { throw new Error('must not run') }), /all imported sources failed/)
  console.log('PASS: empty list, initialization, retry order, init failure, bounded exhaustion, disabled switching, deleted sources')
})().catch(error => { console.error(error); process.exitCode = 1 })

// Exercise real import/storage/reorder code with an in-memory storage adapter.
const storage = new Map()
const copy = value => value === undefined ? undefined : structuredClone(value)
function evaluate(path, dependencies) {
  const result = { exports: {} }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports: result.exports,
    require: name => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    global: { i18n: { t: key => key } },
  })
  return result.exports
}
const data = evaluate('src/utils/data.ts', {
  '@/plugins/storage': {
    getData: async key => copy(storage.get(key)),
    saveData: async (key, value) => storage.set(key, copy(value)),
    removeData: async key => storage.delete(key),
    removeDataMultiple: async keys => keys.forEach(key => storage.delete(key)),
    saveDataMultiple: async pairs => pairs.forEach(([key, value]) => storage.set(key, copy(value))),
  },
  '@/config/constant': { storageDataPrefix: { userApi: 'api:', userApiCatalog: 'catalog' } },
  './common': { throttle: callback => callback },
})
;(async () => {
  assert.equal(evaluate('src/config/defaultSetting.ts', {}).default['common.apiSource'], '')
  assert.equal(evaluate('src/config/defaultSetting.ts', {}).default['common.sourceSubscriptionUrl'], '')
  assert.equal((await data.getUserApiList()).length, 0)
  const script = '/**\n * @name Local test\n * @version 1\n */\n({ musicUrl: () => "https://example.com/test.mp3" })'
  const first = await data.addUserApi(script)
  const second = await data.addUserApi(script)
  const saved = await data.getUserApiScript(first.id)
  const localApi = vm.runInNewContext(saved)
  assert.equal(localApi.musicUrl(), 'https://example.com/test.mp3')
  await data.moveUserApi(second.id, -1)
  const list = await data.getUserApiList()
  assert.equal(list[0].id, second.id)
  await data.removeUserApi([first.id, second.id])
  assert.equal((await data.getUserApiList()).length, 0)
  assert.equal(await data.getUserApiScript(first.id), '')
  console.log('PASS: fresh defaults, local script import, script execution, persisted order, removal')
})().catch(error => { console.error(error); process.exitCode = 1 })
