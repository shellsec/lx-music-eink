const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

const root = 'E:/GITHUB/lxwear'
const scriptsDir = path.join(root, 'src/sources/scripts')

for (const name of fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.js'))) {
  const p = path.join(scriptsDir, name)
  const raw = fs.readFileSync(p)
  const text = raw.toString('utf8').replace(/\s+$/, '')
  const buf = Buffer.from(text, 'utf8')
  if (buf.length !== raw.length) {
    fs.writeFileSync(p, buf)
    console.log('trim', name, raw.length, '->', buf.length, crypto.createHash('md5').update(buf).digest('hex'))
  } else {
    console.log('ok', name, buf.length, crypto.createHash('md5').update(buf).digest('hex'))
  }
}

// regenerate builtins
require('./gen-builtin-sources.js')

// verify flower
const flowerMod = fs.readFileSync(path.join(root, 'src/sources/builtin/flower.ts'), 'utf8')
const json = flowerMod.slice(flowerMod.indexOf('export const script = ') + 'export const script = '.length).trim()
const script = JSON.parse(json)
console.log('builtin flower md5', crypto.createHash('md5').update(script).digest('hex'), 'len', script.length)
console.log('expected', '9ee1b5749b81220180c9978530f8ad2e')

// sync legacy FLOWER_SCRIPT
fs.writeFileSync(
  path.join(root, 'src/sources/flower/script.ts'),
  [
    '/** 内置 Flower（野花）自定义音源脚本，启动时自动加载，无需手动导入 */',
    "export const FLOWER_USER_API_ID = 'user_api_flower_builtin'",
    '',
    'export const FLOWER_SCRIPT = ' + JSON.stringify(script),
    '',
  ].join('\n')
)

// ensure assets only has preload
const assetsScript = path.join(root, 'android/app/src/main/assets/script')
for (const f of fs.readdirSync(assetsScript)) {
  if (f !== 'user-api-preload.js') {
    fs.unlinkSync(path.join(assetsScript, f))
    console.log('removed asset', f)
  }
}
console.log('assets left', fs.readdirSync(assetsScript))
