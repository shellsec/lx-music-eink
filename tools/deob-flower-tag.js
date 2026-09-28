const fs = require('fs')
const crypto = require('crypto')
const https = require('https')
const http = require('http')
const { URL } = require('url')

const s = fs.readFileSync('E:/GITHUB/lxwear/src/sources/scripts/flower.js', 'utf8')
const m = s.match(/function R\(\)\{const Rl=(\[[\s\S]*?\]);R=function\(\)\{return Rl;\}/)
const arr = eval(m[1])
console.log('ALL STRINGS:')
arr.forEach((x, i) => console.log(String(i).padStart(3), JSON.stringify(x)))

// Reconstruct likely base URL from fragments
const joins = [
  'http://97.' + '64.37.235/' + 'flower/v1',
  'https://re' + 'gistry.npmmirror.com' + '/flower-so' + 'urce-info/' + 'latest',
  'https://re' + 'gistry.npmjs.org' + '/flower-so' + 'urce-info/' + 'latest',
]
console.log('\nlikely URLs from fragments (manual):')
// Find pieces containing digits IP
arr.forEach((x, i) => { if (/\d+\.\d+|\.org|\.com|flower|url|http/.test(x)) console.log(i, x) })

function hostOf(u) { try { return new URL(u).hostname } catch { return null } }
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const method = (options.method || 'GET').toUpperCase()
    const headers = Object.assign({
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
    }, options.headers || {})
    const lib = url.startsWith('https') ? https : http
    const req = lib.request(url, { method, headers, timeout: 20000, rejectUnauthorized: false }, (res) => {
      const c = []
      res.on('data', d => c.push(d))
      res.on('end', () => {
        const text = Buffer.concat(c).toString('utf8')
        let body; try { body = JSON.parse(text) } catch { body = text }
        resolve({ statusCode: res.statusCode, body, headers: res.headers })
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    req.end()
  })
}

async function tryTags() {
  // 根据脚本逻辑：path = 'url/' + source + '/' + id + '/' + quality
  // tag = md5( something of path )
  // 从混淆代码看：先 K = path，再对 K.match(/(?:\d\w)+/g) 做 JSON.stringify(..., null, 2)，再 buffer.from(...,?), bufToString hex?, 再 md5
  const path = 'url/kw/7149583/128k'
  // 也试完整 URL path
  const candidates = []
  const variants = [
    path,
    '/flower/v1/' + path,
    'http://97.64.37.235/flower/v1/' + path,
    path.match(/(?:\d\w)+/g),
  ]
  for (const v of variants) {
    const matched = typeof v === 'string' ? v.match(/(?:\d\w)+/g) : v
    const pretty = JSON.stringify(matched, null, 2)
    const hex = Buffer.from(pretty, 'utf8').toString('hex')
    const md5hex = crypto.createHash('md5').update(pretty, 'utf8').digest('hex')
    const md5hex2 = crypto.createHash('md5').update(hex, 'utf8').digest('hex')
    const md5ofPath = crypto.createHash('md5').update(path, 'utf8').digest('hex')
    candidates.push({ label: typeof v === 'string' ? v.slice(0, 40) : 'match-arr', prettyLen: pretty.length, md5hex, md5hex2, md5ofPath, prettyHead: pretty.slice(0, 60) })
  }

  // 脚本里: bufToString(from(JSON.stringify(match), ?), 'hex') then maybe that's the tag directly (hex of utf8 bytes) - length would be pretty.length*2
  const matched = path.match(/(?:\d\w)+/g)
  const pretty = JSON.stringify(matched, null, 2)
  const tagHexOfUtf8 = Buffer.from(pretty, 'utf8').toString('hex')
  console.log('\ntag candidate lengths:')
  console.log('pretty', pretty)
  console.log('hex(utf8(pretty)) len', tagHexOfUtf8.length, 'value head', tagHexOfUtf8.slice(0, 44))
  console.log('md5(pretty)', crypto.createHash('md5').update(pretty).digest('hex'), 'len', 32)
  // Our observed tag len was 44 — what is 44 chars?
  // base64(md5 binary) = 24 chars. base64(sha256)=44 chars!
  const sha256b64 = crypto.createHash('sha256').update(pretty).digest('base64')
  const sha256b64path = crypto.createHash('sha256').update(path).digest('base64')
  console.log('sha256b64(pretty) len', sha256b64.length, sha256b64)
  console.log('sha256b64(path) len', sha256b64path.length, sha256b64path)

  // Try: utils.buffer.bufToString(utils.crypto??? 
  // From strings: hash, bufToString, from, md5, hex, tag
  // Code: P['tag'] = utils.crypto.md5( utils.buffer.bufToString( utils.buffer.from( JSON.stringify(K.match(...), null, 2) ), 'hex' ) )
  // Wait: from(string) without encoding = utf8 bytes; bufToString(..., 'hex') = hex encode; md5(hexString) = 32 char
  // That gives len 32, not 44.

  // Alternative: P['tag'] = utils.buffer.bufToString(utils.buffer.from(utils.crypto.md5(...), 'hex'), 'base64')?
  // md5 hex -> from hex -> bufToString base64 = 24 chars

  // What about: bufToString(from(JSON.stringify(match), null, 2 as encoding?)) 
  // Actually look at call: T[hash?][bufToString]( T[buffer][from]( JSON.stringify(K.match(...), null, 2) ), 'hex' )
  // That is hex-encoding of the JSON string UTF-8 bytes — NOT md5. Length = pretty.length * 2.
  console.log('hex(pretty) full len', tagHexOfUtf8.length)
  // pretty of ["url","kw","7149583","128k"] with null,2 is about 40 chars → 80 hex. Not 44.

  // Try match result differently - only digits and word: 
  console.log('match', path.match(/(?:\d\w)+/g))

  // Maybe tag is md5 of path + something = 32, and we miscounted?
  // Log said [len=44]. Let me re-verify by computing what script actually sets.
}

tryTags().then(async () => {
  // Instrument md5 and bufToString during live run
  const apiCalls = []
  let requestHandler = null
  let initInfo = null
  const traces = []

  const initDone = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 20000)
    global.__ok = (i) => { clearTimeout(t); initInfo = i; resolve(i) }
  })

  const realMd5 = (str) => crypto.createHash('md5').update(String(str), 'utf8').digest('hex')
  const lx = {
    EVENT_NAMES: { request: 'request', inited: 'inited', updateAlert: 'updateAlert' },
    version: '1.9.1',
    env: 'mobile',
    currentScriptInfo: { name: '野花', description: '', version: '1', author: '', homepage: '', rawScript: s },
    utils: {
      crypto: {
        md5(str) {
          const out = realMd5(str)
          traces.push({ fn: 'md5', inLen: String(str).length, inHead: String(str).slice(0, 80), out })
          return out
        },
        randomBytes(n) { return crypto.randomBytes(n) },
      },
      buffer: {
        from(input, encoding) {
          let out
          if (typeof input === 'string') {
            if (encoding === 'hex') out = new Uint8Array(Buffer.from(input, 'hex'))
            else if (encoding === 'base64') out = new Uint8Array(Buffer.from(input, 'base64'))
            else out = new Uint8Array(Buffer.from(input, 'utf8'))
          } else out = new Uint8Array(input)
          traces.push({ fn: 'buffer.from', encoding, inType: typeof input, inLen: (input && input.length) || 0 })
          return out
        },
        bufToString(buf, format) {
          const b = Buffer.from(buf)
          let out
          if (format === 'hex') out = b.toString('hex')
          else if (format === 'base64') out = b.toString('base64')
          else out = b.toString('utf8')
          traces.push({ fn: 'bufToString', format, outLen: out.length, outHead: out.slice(0, 60) })
          return out
        },
      },
    },
    request(url, options, callback) {
      const headers = { ...(options && options.headers) }
      const summary = {}
      for (const [k, v] of Object.entries(headers)) {
        summary[k] = (k.toLowerCase() === 'tag') ? { len: String(v).length, head: String(v).slice(0, 8), full: String(v) } : String(v).slice(0, 60)
      }
      apiCalls.push({ host: hostOf(url), path: new URL(url).pathname, status: '...', headers: summary })
      httpRequest(url, { method: options.method || 'GET', headers })
        .then(resp => {
          apiCalls[apiCalls.length - 1].status = resp.statusCode
          apiCalls[apiCalls.length - 1].body = typeof resp.body === 'object' ? { code: resp.body.code, msg: resp.body.msg || resp.body.message } : String(resp.body).slice(0, 100)
          callback(null, { statusCode: resp.statusCode, body: resp.body, headers: resp.headers }, resp.body)
        })
        .catch(err => callback(err, null, null))
    },
    on(e, h) { if (e === 'request') requestHandler = h },
    send(e, d) { if (e === 'inited') global.__ok(d); return Promise.resolve() },
  }
  globalThis.lx = lx
  eval(s)
  await initDone
  traces.length = 0
  try {
    const url = await requestHandler.call(lx, {
      source: 'kw', action: 'musicUrl',
      info: { type: '128k', musicInfo: { name: '晴天', singer: '周杰伦', songmid: '7149583', source: 'kw' } },
    })
    console.log('\nURL host', hostOf(url))
  } catch (e) {
    console.log('\nthrow', JSON.stringify(e.message))
  }
  console.log('\nTRACES:')
  traces.forEach(t => console.log(JSON.stringify(t)))
  console.log('\nCALLS:')
  apiCalls.forEach(c => console.log(JSON.stringify(c)))
}).catch(e => console.error(e))
