const fs = require('fs')
const crypto = require('crypto')

const src = 'E:/GITHUB/lxwear/src/sources/scripts/flower.js'
let s = fs.readFileSync(src, 'utf8').replace(/\s+$/, '')
console.log('md5', crypto.createHash('md5').update(s).digest('hex'), 'len', s.length)
fs.writeFileSync(src, s)
fs.writeFileSync('E:/GITHUB/lxwear/android/app/src/main/assets/script/flower.js', s)

const flowerTs = [
  'export const id = "user_api_builtin_flower"',
  'export const name = "野花"',
  'export const author = "pdone"',
  'export const version = "1"',
  'export const script = ' + JSON.stringify(s),
  '',
].join('\n')
fs.writeFileSync('E:/GITHUB/lxwear/src/sources/builtin/flower.ts', flowerTs)

const legacy = [
  '/** 内置 Flower（野花）自定义音源脚本，启动时自动加载，无需手动导入 */',
  "export const FLOWER_USER_API_ID = 'user_api_flower_builtin'",
  '',
  'export const FLOWER_SCRIPT = ' + JSON.stringify(s),
  '',
].join('\n')
fs.writeFileSync('E:/GITHUB/lxwear/src/sources/flower/script.ts', legacy)

// grass likewise strip trailing whitespace if any
for (const name of ['grass', 'huibq', 'ikun', 'juhe', 'qdy', 'sixyin']) {
  const p = 'E:/GITHUB/lxwear/src/sources/scripts/' + name + '.js'
  if (!fs.existsSync(p)) continue
  const raw = fs.readFileSync(p, 'utf8')
  const trimmed = raw.replace(/\s+$/, '')
  if (trimmed.length !== raw.length) {
    fs.writeFileSync(p, trimmed)
    fs.writeFileSync('E:/GITHUB/lxwear/android/app/src/main/assets/script/' + name + '.js', trimmed)
    console.log('trimmed', name, raw.length, '->', trimmed.length)
  }
}

console.log('done')
