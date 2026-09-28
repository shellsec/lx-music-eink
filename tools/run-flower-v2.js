const https = require('https')
const http = require('http')
const fs = require('fs')
const crypto = require('crypto')
const { URL } = require('url')

function hostOf(u) { try { return new URL(u).hostname } catch { return null } }

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const method = (options.method || 'GET').toUpperCase()
    const headers = Object.assign({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
      Accept: 'application/json',
    }, options.headers || {})
    const lib = url.startsWith('https') ? https : http
    const req = lib.request(url, { method, headers, timeout: 20000, rejectUnauthorized: false }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let body
        try { body = JSON.parse(text) } catch { body = text }
        resolve({ statusCode: res.statusCode, headers: res.headers, body })
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    req.end()
  })
}

async function checkAudio(audioUrl) {
  if (!audioUrl || !/^https?:\/\//i.test(String(audioUrl))) return { ok: false, host: null, status: 0 }
  const host = hostOf(audioUrl)
  try {
    let r = await httpRequest(audioUrl, { method: 'HEAD', headers: { Range: 'bytes=0-1' } })
    if (!r.statusCode || r.statusCode >= 400) r = await httpRequest(audioUrl, { method: 'GET', headers: { Range: 'bytes=0-1' } })
    return { ok: r.statusCode >= 200 && r.statusCode < 400, host, status: r.statusCode }
  } catch (e) {
    return { ok: false, host, status: 0, note: e.message }
  }
}

async function main() {
  // 1) 看 init 源信息
  const info = await httpRequest('https://registry.npmmirror.com/flower-source-info/latest')
  console.log('flower-source-info status', info.statusCode)
  const dist = info.body && info.body.dist
  const ver = info.body && info.body.version
  console.log('npm version', ver, 'tarball host', dist && hostOf(dist.tarball))
  // versions often embed config in package description or a file - dump top keys
  console.log('pkg keys', info.body && Object.keys(info.body))
  // Some flower packages put mirrors in `s` field via a separate URL - the script fetches the latest JSON
  // Dump non-sensitive short fields
  for (const k of ['description', 's', 'm', 'lv', 'lu', 'lh', 'config', 'mirrors']) {
    if (info.body && info.body[k] != null) console.log(k, typeof info.body[k] === 'string' ? info.body[k].slice(0, 200) : JSON.stringify(info.body[k]).slice(0, 200))
  }

  // 2) 用与 preload 一致的 md5（encodeURIComponent → hash，对应 native URLDecoder 再 hash 的近似）
  // 真实客户端：JS encodeURIComponent → Java URLDecoder.decode → MD5
  // 等价于对原始字符串做 MD5（除 + 等边界）；这里同时实现两种
  function md5ClientLike(str) {
    // 模拟 QuickJS.java: URLDecoder.decode(encodeURIComponent(str)) then MD5
    const encoded = encodeURIComponent(str)
    const decoded = decodeURIComponent(encoded.replace(/\+/g, '%20')) // URLDecoder treats + as space; encodeURIComponent never emits +
    // Actually Java URLDecoder: + → space. encodeURIComponent uses %20 not +. So decodeURIComponent(encodeURIComponent(s)) === s
    return crypto.createHash('md5').update(decoded, 'utf8').digest('hex')
  }

  const script = fs.readFileSync('E:/GITHUB/lxwear/src/sources/scripts/flower.js', 'utf8')
  const apiCalls = []
  let requestHandler = null
  let initInfo = null

  const initDone = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('init timeout')), 25000)
    global.__ok = (info) => { clearTimeout(t); initInfo = info; resolve(info) }
    global.__fail = (e) => { clearTimeout(t); reject(e) }
  })

  const lx = {
    EVENT_NAMES: { request: 'request', inited: 'inited', updateAlert: 'updateAlert' },
    version: '1.9.1',
    env: 'mobile',
    currentScriptInfo: {
      name: '野花🌷',
      description: '',
      version: '1',
      author: '',
      homepage: '',
      rawScript: script,
    },
    utils: {
      crypto: {
        md5: md5ClientLike,
        randomBytes(n) { return crypto.randomBytes(n) },
        aesEncrypt() { throw new Error('no aes') },
        rsaEncrypt() { throw new Error('no rsa') },
      },
      buffer: {
        from(data, encoding) {
          if (typeof data === 'string') {
            if (encoding === 'hex') return new Uint8Array(Buffer.from(data, 'hex'))
            if (encoding === 'base64') return new Uint8Array(Buffer.from(data, 'base64'))
            return new Uint8Array(Buffer.from(data, 'utf8'))
          }
          return new Uint8Array(data)
        },
        bufToString(buf, format) {
          const b = Buffer.from(buf)
          if (format === 'hex') return b.toString('hex')
          if (format === 'base64') return b.toString('base64')
          return b.toString('utf8')
        },
      },
    },
    request(url, options, callback) {
      const method = (options && options.method) || 'get'
      const headers = { ...(options && options.headers) }
      // 记录 header 名与非敏感值；签名类 header 只记是否存在与长度
      const headerSummary = {}
      for (const [k, v] of Object.entries(headers)) {
        const key = k.toLowerCase()
        if (key === 'user-agent' || key === 'ver' || key === 'source-ver' || key === 'content-type') {
          headerSummary[k] = String(v).slice(0, 80)
        } else {
          headerSummary[k] = `[len=${String(v).length}]`
        }
      }
      const host = hostOf(url)
      const path = (() => { try { return new URL(url).pathname + new URL(url).search } catch { return '' } })()
      httpRequest(url, { method, headers, body: options && options.body })
        .then((resp) => {
          apiCalls.push({ host, path, status: resp.statusCode, method, headers: headerSummary, bodyCode: resp.body && resp.body.code, bodyMsg: resp.body && (resp.body.msg || resp.body.message) })
          callback(null, { statusCode: resp.statusCode, statusMessage: '', headers: resp.headers, body: resp.body }, resp.body)
        })
        .catch((err) => {
          apiCalls.push({ host, path, status: 0, method, headers: headerSummary, err: err.message })
          callback(err, null, null)
        })
    },
    on(event, handler) { if (event === 'request') requestHandler = handler },
    send(event, data) {
      if (event === 'inited') global.__ok(data)
      return Promise.resolve()
    },
  }
  globalThis.lx = lx
  global.lx = lx
  eval(script)
  await initDone
  console.log('\ninit sources', Object.keys(initInfo.sources || {}))

  const musicInfo = {
    name: '晴天', singer: '周杰伦', source: 'kw', songmid: '7149583',
    albumId: '', interval: '04:29', img: '', types: [], _types: {}, type: '', _msg: '',
  }

  let url = null
  try {
    url = await requestHandler.call(lx, { source: 'kw', action: 'musicUrl', info: { type: '128k', musicInfo } })
  } catch (e) {
    console.log('musicUrl throw:', JSON.stringify(e && e.message))
  }

  console.log('\ncalls:')
  for (const c of apiCalls) {
    console.log(JSON.stringify(c))
  }

  if (url) {
    const check = await checkAudio(url)
    console.log('\nPLAYABLE', check.ok, 'audioHost', check.host, 'audioStatus', check.status)
  } else {
    console.log('\nPLAYABLE false')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
