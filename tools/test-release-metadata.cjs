const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const requests = []
const downloads = []
const exported = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/version.js', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, {
  exports: exported,
  require: name => {
    if (name === '../../package.json') return pkg
    if (name === '@/utils/request') return { httpGet: (url, options, callback) => {
      requests.push(url)
      callback(null, { statusCode: 200 }, { version: pkg.version })
    } }
    if (name === '@/utils/fs') return {
      temporaryDirectoryPath: '/test', stopDownload: () => {},
      downloadFile: url => { downloads.push(url); return { jobId: 1, promise: Promise.resolve() } },
    }
    if (name === '@/utils/nativeModules/utils') return { getSupportedAbis: async () => ['arm64-v8a'], installApk: async () => {} }
    if (name === '@/config/constant') return { APP_PROVIDER_NAME: 'test' }
    throw new Error(name)
  },
})
;(async () => {
  await exported.getVersionInfo()
  assert.equal(requests[0], 'https://raw.githubusercontent.com/shellsec/lx-music-eink/master/publish/version.json')
  await exported.downloadNewVersion(pkg.version)
  assert.equal(downloads[0], `https://github.com/shellsec/lx-music-eink/releases/download/v${pkg.version}/${pkg.name}-v${pkg.version}-arm64-v8a.apk`)
  console.log('PASS: fork update metadata and APK download target the new repository')
})().catch(error => { console.error(error); process.exitCode = 1 })
