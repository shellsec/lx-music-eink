/**
 * 用与洛雪 preload 等价的最小 lx 环境跑 Flower 脚本，实测 musicUrl。
 * 只打印主机名与 HTTP 状态，不输出完整签名 URL。
 */
const https = require('https')
const http = require('http')
const fs = require('fs')
const crypto = require('crypto')
const { URL } = require('url')

function hostOf(u) {
  try { return new URL(u).hostname } catch { return null }
}

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const method = (options.method || 'GET').toUpperCase()
    const headers = Object.assign({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
      Accept: 'application/json',
    }, options.headers || {})
    const req = lib.request(url, { method, headers, timeout: 20000, rejectUnauthorized: false }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        let body
        const text = buf.toString('utf8')
        try { body = JSON.parse(text) } catch { body = text }
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body,
          url: res.url || url,
          ok: res.statusCode >= 200 && res.statusCode < 300,
        })
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    if (options.body) {
      if (typeof options.body === 'string') req.write(options.body)
      else if (Buffer.isBuffer(options.body)) req.write(options.body)
      else req.write(JSON.stringify(options.body))
    }
    req.end()
  })
}

async function checkAudio(audioUrl) {
  if (!audioUrl || !/^https?:\/\//i.test(String(audioUrl))) {
    return { ok: false, host: null, status: 0, note: 'no url' }
  }
  const host = hostOf(audioUrl)
  let r
  try {
    r = await httpRequest(audioUrl, { method: 'HEAD', headers: { Range: 'bytes=0-1' } })
    if (!r.statusCode || r.statusCode >= 400) {
      r = await httpRequest(audioUrl, { method: 'GET', headers: { Range: 'bytes=0-1' } })
    }
  } catch (e) {
    return { ok: false, host, status: 0, note: e.message }
  }
  return { ok: r.statusCode >= 200 && r.statusCode < 400, host, status: r.statusCode }
}

async function main() {
  const script = fs.readFileSync('E:/GITHUB/lxwear/src/sources/scripts/flower.js', 'utf8')

  const pendingNativeRequests = new Map()
  let requestHandler = null
  let initInfo = null
  let initError = null
  const initDone = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('init timeout 25s')), 25000)
    global.__resolveInit = (ok, info, err) => {
      clearTimeout(t)
      if (ok) { initInfo = info; resolve(info) }
      else { initError = err; reject(new Error(err || 'init failed')) }
    }
  })

  // 捕获脚本发出的 HTTP（只记 host+status）
  const apiCalls = []

  const lx = {
    EVENT_NAMES: { request: 'request', inited: 'inited', updateAlert: 'updateAlert' },
    version: '1.9.1',
    env: 'mobile',
    currentScriptInfo: {
      name: '野花',
      description: '',
      version: '1',
      author: 'pdone',
      homepage: '',
      rawScript: script,
    },
    utils: {
      crypto: {
        md5(str) {
          return crypto.createHash('md5').update(String(str), 'utf8').digest('hex')
        },
        aesEncrypt() { throw new Error('aes not needed') },
        rsaEncrypt() { throw new Error('rsa not needed') },
        randomBytes(n) { return crypto.randomBytes(n) },
      },
      buffer: {
        from(data, encoding) {
          if (encoding === 'hex') return Buffer.from(data, 'hex')
          if (encoding === 'base64') return Buffer.from(data, 'base64')
          return Buffer.from(data)
        },
        bufToString(buf, encoding) {
          if (encoding === 'hex') return Buffer.from(buf).toString('hex')
          if (encoding === 'base64') return Buffer.from(buf).toString('base64')
          return Buffer.from(buf).toString('utf8')
        },
      },
    },
    request(url, options, callback) {
      const method = (options && options.method) || 'GET'
      const headers = (options && options.headers) || {}
      // 只记录主机，不打印完整 URL（可能含签名）
      const host = hostOf(url)
      const pathOnly = (() => { try { return new URL(url).pathname } catch { return '' } })()
      httpRequest(url, { method, headers, body: options && options.body })
        .then((resp) => {
          apiCalls.push({ host, path: pathOnly, status: resp.statusCode, method })
          // flower 期望 needle 风格 callback(err, resp) 且 resp.body 已是对象
          callback(null, {
            body: resp.body,
            statusCode: resp.statusCode,
            headers: resp.headers,
          })
        })
        .catch((err) => {
          apiCalls.push({ host, path: pathOnly, status: 0, method, err: err.message })
          callback(err, null)
        })
    },
    on(event, handler) {
      if (event === 'request') requestHandler = handler
    },
    send(event, data) {
      if (event === 'inited') {
        global.__resolveInit(true, data, null)
      } else if (event === 'updateAlert') {
        console.log('[flower] updateAlert (skipped)')
      }
    },
  }

  globalThis.lx = lx
  global.lx = lx

  // 执行脚本（IIFE）
  // eslint-disable-next-line no-eval
  eval(script)

  console.log('waiting init...')
  try {
    await initDone
    console.log('init OK sources:', initInfo && Object.keys((initInfo.sources) || {}).join(','))
  } catch (e) {
    console.log('init FAIL:', e.message)
    console.log('apiCalls during init:', JSON.stringify(apiCalls, null, 2))
    process.exit(1)
  }

  if (!requestHandler) {
    console.log('no request handler registered')
    process.exit(1)
  }

  // 真实曲目：酷我「晴天」
  const musicInfo = {
    name: '晴天',
    singer: '周杰伦',
    source: 'kw',
    songmid: '7149583',
    albumId: '',
    interval: '04:29',
    img: '',
    lrc: null,
    types: [],
    _types: {},
    type: '',
    _msg: '',
  }

  console.log('\n=== musicUrl kw/7149583/128k ===')
  let url = null
  try {
    url = await requestHandler.call(lx, {
      source: 'kw',
      action: 'musicUrl',
      info: { type: '128k', musicInfo },
    })
  } catch (e) {
    console.log('musicUrl error:', e.message)
  }

  console.log('apiCalls:', JSON.stringify(apiCalls.map(({ host, path, status, method, err }) => ({ host, path, status, method, err })), null, 2))

  if (url) {
    const check = await checkAudio(url)
    console.log('RESULT playable=', check.ok, 'audioHost=', check.host, 'audioStatus=', check.status, 'apiUrlHost=', hostOf(url) === check.host ? check.host : hostOf(url))
  } else {
    console.log('RESULT playable=false no url returned')
  }

  // 再试网易云
  console.log('\n=== musicUrl wy/186016/128k ===')
  apiCalls.length = 0
  try {
    url = await requestHandler.call(lx, {
      source: 'wy',
      action: 'musicUrl',
      info: {
        type: '128k',
        musicInfo: { ...musicInfo, source: 'wy', songmid: '186016', songId: 186016 },
      },
    })
    const check = await checkAudio(url)
    console.log('apiCalls:', JSON.stringify(apiCalls.map(({ host, path, status, method }) => ({ host, path, status, method })), null, 2))
    console.log('RESULT playable=', check.ok, 'audioHost=', check.host, 'audioStatus=', check.status)
  } catch (e) {
    console.log('musicUrl wy error:', e.message)
    console.log('apiCalls:', JSON.stringify(apiCalls, null, 2))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
