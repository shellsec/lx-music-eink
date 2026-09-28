/** 反混淆 Flower 脚本中的字符串表与关键逻辑片段 */
const fs = require('fs')
const s = fs.readFileSync('E:/GITHUB/lxwear/src/sources/scripts/flower.js', 'utf8')

// 抽出 R() 返回的数组并按脚本同样方式旋转，直到校验通过
// 简化：直接 eval 脚本开头的字符串解密函数
const start = s.indexOf('function R()')
const end = s.indexOf('return R();', start)
const rFn = s.slice(start, end + 'return R();'.length)
// Also need Z and the bootstrap - easier to patch and dump

const dumpScript = `
${s}
// after flower IIFE, dump nothing - instead instrument
`
// Better approach: monkeypatch Array and extract after rotation by running partial

// Extract string array literal from function R
const m = s.match(/function R\(\)\{const Rl=(\[[\s\S]*?\]);R=function\(\)\{return Rl;\}/)
if (!m) {
  console.log('no Rl match')
  // try alternate
  const m2 = s.match(/function R\(\)\{const \w+=(\[[\s\S]*?\]);R=function/)
  console.log('alt', !!m2, m2 && m2[1].slice(0, 100))
} else {
  const arr = eval(m[1])
  console.log('arr len', arr.length)
  // decode \x in strings already done by eval
  arr.forEach((x, i) => {
    if (/http|flower|url|tag|hash|md5|User|97\.|mirror|registry|npmmirror|source/i.test(String(x))) {
      console.log(i, JSON.stringify(x))
    }
  })
}
