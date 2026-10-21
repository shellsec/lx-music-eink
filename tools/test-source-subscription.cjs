const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const storage = new Map()
const setting = { setting: { 'common.apiSource': 'user_api_auto', 'common.sourceSubscriptionUrl': '' } }
const state = { list: [] }
const loaded = []
const requests = []
let now = 1000000
let failNetwork = false
let manifest = { sources: [{ id: 'test', name: 'Test source', url: 'https://example.com/test.js' }] }
let script = '/**\n * @name Local test\n * @version 1\n */\n// version 1'
const lx = { apiInitPromise: [Promise.resolve(false), true, () => {}] }
const constant = { storageDataPrefix: { userApi: 'api:', userApiCatalog: 'old-catalog', userApiSubscription: 'subscription', setting: 'settings' } }
const clone = value => value === undefined ? undefined : structuredClone(value)
const storageApi = {
  getData: async key => clone(storage.get(key)),
  saveData: async (key, value) => storage.set(key, clone(value)),
  removeData: async key => storage.delete(key),
  removeDataMultiple: async keys => keys.forEach(key => storage.delete(key)),
  saveDataMultiple: async pairs => pairs.forEach(([key, value]) => storage.set(key, clone(value))),
}
const cache = {}
function load(path) {
  if (cache[path]) return cache[path]
  const result = { exports: {} }
  cache[path] = result.exports
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports: result.exports,
    require: name => {
      if (name === '@/config/constant') return constant
      if (name === '@/plugins/storage') return storageApi
      if (name === './common' && path.endsWith('data.ts')) return { throttle: callback => callback }
      if (name === '@/core/common') return { updateSetting: patch => Object.assign(setting.setting, patch) }
      if (name === '@/utils/data') return load('src/utils/data.ts')
      if (name === '@/store/setting/state') return { default: setting }
      if (name === '@/store/userApi') return { state }
      if (name === '@/core/sourceSubscription') return load('src/core/sourceSubscription.ts')
      if (name === '@/core/userApi') return {
        setUserApiList: list => { state.list = list },
        setUserApi: async id => { loaded.push(id); lx.apiInitPromise[2](true) },
      }
      throw new Error(`Unexpected dependency: ${name}`)
    },
    global: { lx, i18n: { t: key => key } },
    Date: class extends Date { static now() { return now } },
    setTimeout, clearTimeout, AbortController,
    fetch: async url => {
      requests.push(url)
      if (failNetwork) throw new Error('offline')
      return { ok: true, text: async () => url.endsWith('.json') ? JSON.stringify(manifest) : script }
    },
  })
  return result.exports
}
;(async () => {
  const subscription = load('src/core/sourceSubscription.ts')
  const data = load('src/utils/data.ts')
  const failover = load('src/core/userApiFailover.ts')
  await data.getUserApiList()
  assert.equal(await subscription.refreshSubscriptionAfterFailure('empty'), false)
  assert.equal(requests.length, 0)
  await subscription.saveSubscriptionAddress('https://example.com/sources.json')
  assert.equal(storage.get('settings')['common.sourceSubscriptionUrl'], 'https://example.com/sources.json')
  assert.equal(requests.length, 0, 'saving must not fetch')
  await assert.rejects(subscription.saveSubscriptionAddress('invalid'), /HTTPS/)
  assert.equal(storage.get('settings')['common.sourceSubscriptionUrl'], 'https://example.com/sources.json')
  assert.equal(await subscription.refreshSubscription(), true)
  assert.equal(state.list.length, 1)
  const importedId = state.list[0].id
  assert.equal(await subscription.refreshSubscription(), false, 'unchanged scripts must not trigger retry')
  script += '\n// updated'
  now += 300001
  failover.setLoadedUserApiId(importedId)
  requests.length = 0
  const result = await failover.tryUserApiFailover(async () => ({ url: 'https://example.com/audio.mp3', type: '128k' }), 'song-a')
  assert.equal(result.type, '128k')
  assert.equal(requests.filter(url => url.endsWith('.json')).length, 1)
  assert.equal(loaded.pop(), importedId, 'script updates must keep stable local IDs')
  assert.equal(await data.getUserApiScript(importedId), script)
  await assert.rejects(failover.tryUserApiFailover(async () => { throw new Error('unavailable') }, 'song-a'))
  assert.equal(requests.filter(url => url.endsWith('.json')).length, 1, 'same song must not fetch again')
  assert.equal(await subscription.refreshSubscriptionAfterFailure('song-b'), false, 'cooldown applies across songs')
  now += 300001
  requests.length = 0
  const unchanged = await Promise.all([
    subscription.refreshSubscriptionAfterFailure('song-c'), subscription.refreshSubscriptionAfterFailure('song-d'),
  ])
  assert.equal(unchanged.some(Boolean), false)
  assert.equal(requests.filter(url => url.endsWith('.json')).length, 1, 'concurrent checks must be merged')
  now += 300001
  failNetwork = true
  await assert.rejects(subscription.refreshSubscriptionAfterFailure('offline'))
  failNetwork = false
  assert.equal(await subscription.refreshSubscriptionAfterFailure('offline'), false, 'failed fetch must not loop')
  assert.equal(await data.getUserApiScript(importedId), script, 'network failure keeps local scripts')
  now += 300001
  script += '\n// next version'
  requests.length = 0
  failover.setLoadedUserApiId(importedId)
  await assert.rejects(failover.tryUserApiFailover(async () => { throw new Error('all fail') }, 'song-exhausted'))
  assert.equal(requests.filter(url => url.endsWith('.json')).length, 1, 'second round must not fetch recursively')
  const manual = await data.addUserApi('/**\n * @name Manual\n */\n// manual')
  state.list = await data.getUserApiList()
  manifest.sources[0].name = 'Renamed source'
  assert.equal(await subscription.refreshSubscription(), true, 'manifest-only changes must be detected')
  assert.equal(state.list.find(item => item.id === importedId).name, 'Renamed source')
  manifest.sources.push({ id: 'test2', name: 'Second source', url: 'https://example.com/test2.js' })
  assert.equal(await subscription.refreshSubscription(), true)
  assert.equal(state.list.length, 3)
  const secondId = state.list[2].id
  await data.moveUserApi(secondId, -1)
  state.list = await data.getUserApiList()
  assert.equal(await subscription.refreshSubscription(), false)
  assert.equal(state.list[1].id, secondId, 'user order survives subscription refresh')
  const validManifest = structuredClone(manifest)
  manifest.sources.push(manifest.sources[0])
  await assert.rejects(subscription.refreshSubscription(), /清单条目/)
  assert.equal((await data.getUserApiList()).length, 3)
  manifest = validManifest
  const validScript = script
  script = '<html>upstream error</html>'
  await assert.rejects(subscription.refreshSubscription(), /无效的订阅源脚本/)
  assert.equal(await data.getUserApiScript(importedId), validScript)
  script = validScript
  manifest = { sources: [] }
  assert.equal(await subscription.refreshSubscription(), true)
  assert.equal(state.list.length, 1)
  assert.equal(state.list[0].id, manual.id, 'subscription removals must preserve manual imports')
  await subscription.saveSubscriptionAddress('')
  assert.equal(storage.get('settings')['common.sourceSubscriptionUrl'], '')
  console.log('PASS: saved address, manual sync, script updates, unchanged manifest, one extra round, per-song limit, cooldown, concurrency, offline preservation, manual imports')
})().catch(error => { console.error(error); process.exitCode = 1 })
