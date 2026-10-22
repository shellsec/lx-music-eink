const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const state = { list: [] }
const setting = { setting: { 'common.sourceSubscriptionUrl': '' } }
const imported = []
const saved = []
const exportsObject = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/sourceWeb.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, {
  exports: exportsObject,
  require: name => {
    if (name === '@/store/userApi') return { state }
    if (name === '@/store/setting/state') return { default: setting }
    if (name === '@/core/userApi') return { importUserApi: async script => { imported.push(script); state.list.push({ name: 'Test' }) } }
    if (name === '@/core/sourceSubscription') return { saveSubscriptionAddress: async url => { saved.push(url); setting.setting['common.sourceSubscriptionUrl'] = url } }
    throw new Error(name)
  },
  AbortController, setTimeout, clearTimeout,
  fetch: async url => ({ ok: true, text: async () => '/**\n * @name Test\n */\n// user test' }),
})
;(async () => {
  const handle = exportsObject.handleSourceWebRequest
  assert.equal((await handle('{')).status, 400)
  assert.equal((await handle(JSON.stringify({ action: 'unknown' }))).status, 400)
  assert.equal((await handle(JSON.stringify({ action: 'status' }))).data.subscriptionUrl, '')
  assert.equal((await handle(JSON.stringify({ action: 'subscription', value: 'https://example.com/sources.json' }))).status, 200)
  assert.deepEqual(saved, ['https://example.com/sources.json'])
  assert.equal((await handle(JSON.stringify({ action: 'importUrl', value: 'file:///etc/test' }))).status, 400)
  assert.equal((await handle(JSON.stringify({ action: 'importUrl', value: 'https://example.com/test.js' }))).status, 200)
  assert.equal(imported.length, 1)
  assert.equal((await handle(JSON.stringify({ action: 'importScript', value: 'bad' }))).status, 400)
  assert.equal((await handle(JSON.stringify({ action: 'importScript', value: '/**\n * @name Local\n */\n// test' }))).status, 200)
  state.list = Array.from({ length: 20 }, () => ({ name: 'Test' }))
  assert.equal((await handle(JSON.stringify({ action: 'importScript', value: '/** test */' }))).status, 400)
  assert.equal(imported.length, 2)
  console.log('PASS: web source import, subscription saving, invalid input, source limit')
})().catch(error => { console.error(error); process.exitCode = 1 })
