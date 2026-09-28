const fs = require('fs')
const s = fs.readFileSync('E:/GITHUB/lxwear/src/sources/scripts/flower.js', 'utf8')
// decode \xHH in the file content
let d = s.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
const re = /https?:\/\/[a-zA-Z0-9._:\/\-]+/g
const urls = [...new Set(d.match(re) || [])]
console.log('urls:')
urls.forEach(u => console.log(' ', u))
const keys = ['flower', '97.64', 'registry', 'npmmirror', 'v1/url', 'User-Agent', 'md5', 'ver']
for (const k of keys) {
  const i = d.indexOf(k)
  console.log('\n--- around', k, 'idx', i, '---')
  if (i >= 0) console.log(d.slice(Math.max(0, i - 60), i + 160).replace(/\n/g, ' '))
}
