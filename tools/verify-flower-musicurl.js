/**
 * 验证 Flower musicUrl：打印请求失败原因，并用真实榜单歌曲 ID 探测。
 * 不输出完整签名 URL。
 */
const fs = require('fs')
const http = require('http')
const https = require('https')
const crypto = require('crypto')

const SCRIPT = fs.readFileSync('src/sources/flower/latest.js', 'utf8')

function fetchRaw(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.request(url, {
      method: (options.method || 'GET').toUpperCase(),
      headers: options.headers || {},
      timeout: 25000,
    }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const body = Buffer.concat(chunks)
        let json = null
        try { json = JSON.parse(body.toString('utf8')) } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body, bodyText: body.toString('utf8'), json })
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    if (options.body) req.write(options.body)
    req.end()
  })
}

function probeAudio(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-2047', 'User-Agent': 'lx-music-mobile/1.9.1' },
      timeout: 25000,
    }, (res) => {
      res.resume()
      resolve({
        statusCode: res.statusCode,
        contentType: res.headers['content-type'] || '',
        contentLength: res.headers['content-length'] || res.headers['content-range'] || '',
        host: u.host,
        protocol: u.protocol.replace(':', ''),
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

async function fetchKwBoardSong() {
  // 酷我飙升榜（与项目 kw leaderboard 同源思路）
  const url = 'http://wapi.kuwo.cn/api/pc/bang/list?rn=5&pn=1'
  try {
    const r = await fetchRaw(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    console.log('KW_BOARD_STATUS', r.statusCode)
  } catch (e) {
    console.log('KW_BOARD_ERR', e.message)
  }
  // 备用：项目里用的 bangid 接口
  const urls = [
    'http://www.kuwo.cn/api/www/bang/bang/musicList?bangId=16&pn=1&rn=5&httpsStatus=1',
    'https://wapi.kuwo.cn/api/www/bang/bang/musicList?bangId=16&pn=1&rn=5&httpsStatus=1',
  ]
  for (const u of urls) {
    try {
      const r = await fetchRaw(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: 'http://www.kuwo.cn/',
          csrf: '0',
          Cookie: 'kw_token=0',
        },
      })
      console.log('KW_LIST', u.split('?')[0], r.statusCode, (r.bodyText || '').slice(0, 120).replace(/\n/g, ' '))
      const list = r.json?.data?.musicList || r.json?.data?.list || []
      if (list.length) {
        const s = list[0]
        return {
          source: 'kw',
          musicInfo: {
            songmid: String(s.rid || s.MUSICRID || s.id || '').replace(/^MUSIC_/, ''),
            name: s.name || s.SONGNAME || '',
            singer: s.artist || s.ARTIST || '',
          },
          type: '128k',
        }
      }
    } catch (e) {
      console.log('KW_LIST_ERR', e.message)
    }
  }
  return null
}

async function fetchWyBoardSong() {
  // 网易云热歌榜 playlist
  const url = 'https://music.163.com/api/playlist/detail?id=3778678'
  try {
    const r = await fetchRaw(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    console.log('WY_BOARD_STATUS', r.statusCode)
    const tracks = r.json?.result?.tracks || r.json?.playlist?.tracks || []
    if (tracks.length) {
      const t = tracks[0]
      return {
        source: 'wy',
        musicInfo: {
          songmid: String(t.id),
          name: t.name || '',
          singer: (t.artists && t.artists[0] && t.artists[0].name) || '',
        },
        type: '128k',
      }
    }
  } catch (e) {
    console.log('WY_BOARD_ERR', e.message)
  }
  return null
}

async function main() {
  const requestLog = []
  const listeners = new Map()
  let initSources = null

  const EVENT_NAMES = { request: 'request', inited: 'inited', updateAlert: 'updateAlert' }

  const request = (url, options, cb) => {
    const method = ((options && options.method) || 'GET').toUpperCase()
    const headers = (options && options.headers) || {}
    const shortUrl = url.replace(/([?&](sign|token|key|auth)=)[^&]+/gi, '$1***')
    requestLog.push({ method, url: shortUrl, headerKeys: Object.keys(headers) })
    console.log('HTTP_REQ', method, (() => { try { return new URL(url).host + new URL(url).pathname } catch { return shortUrl.slice(0, 80) } })())
    fetchRaw(url, { method, headers, body: options && options.body })
      .then((res) => {
        console.log('HTTP_RES', res.statusCode, (res.bodyText || '').slice(0, 160).replace(/\n/g, ' '))
        cb(null, {
          statusCode: res.statusCode,
          statusMessage: '',
          headers: res.headers,
          body: res.json != null ? res.json : res.bodyText,
        })
      })
      .catch((err) => {
        console.log('HTTP_ERR', err.message)
        cb(err, null)
      })
    return () => {}
  }

  const on = (name, handler) => {
    if (!listeners.has(name)) listeners.set(name, [])
    listeners.get(name).push(handler)
  }
  const send = (name, data) => {
    if (name === 'inited') initSources = data
  }

  // 贴近 preload 的 crypto/buffer
  globalThis.lx = {
    EVENT_NAMES,
    request,
    on,
    send,
    env: 'mobile',
    version: '2.0.0',
    currentScriptInfo: {
      name: '野花',
      description: '',
      version: '1',
      author: 'pdone',
      homepage: '',
      rawScript: SCRIPT,
    },
    utils: {
      crypto: {
        md5(str) {
          return crypto.createHash('md5').update(String(str)).digest('hex')
        },
        aesEncrypt() { throw new Error('aes') },
        rsaEncrypt() { throw new Error('rsa') },
      },
      buffer: {
        from(input, encoding) {
          if (typeof input === 'string') return Buffer.from(input, encoding || 'utf8')
          return Buffer.from(input)
        },
        bufToString(buf, format) {
          const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
          if (format === 'hex') return b.toString('hex')
          if (format === 'base64') return b.toString('base64')
          return b.toString('utf8')
        },
      },
    },
  }

  // eslint-disable-next-line no-new-func
  new Function(SCRIPT)()

  for (let i = 0; i < 50 && !initSources; i++) await new Promise((r) => setTimeout(r, 200))
  if (!initSources) {
    console.log(JSON.stringify({ ok: false, stage: 'init', error: 'inited timeout' }))
    process.exit(2)
  }
  console.log('SOURCES', Object.keys(initSources.sources || initSources))

  const handlers = listeners.get('request') || []
  if (!handlers.length) {
    console.log(JSON.stringify({ ok: false, stage: 'bind', error: 'no request handler' }))
    process.exit(3)
  }

  const candidates = []
  const kw = await fetchKwBoardSong()
  if (kw) candidates.push(kw)
  const wy = await fetchWyBoardSong()
  if (wy) candidates.push(wy)
  // 兜底已知可检索 id
  candidates.push(
    { source: 'kw', musicInfo: { songmid: '228908', name: 'fallback', singer: '' }, type: '128k' },
    { source: 'wy', musicInfo: { songmid: '347230', name: 'fallback', singer: '' }, type: '128k' },
    { source: 'mg', musicInfo: { copyrightId: '600902000004640302', songmid: '600902000004640302', name: 'fallback', singer: '' }, type: '128k' },
    { source: 'tx', musicInfo: { songmid: '0020PeOh4ZaCw1', name: 'fallback', singer: '' }, type: '128k' },
  )

  let lastErr = null
  for (const c of candidates) {
    const id = c.musicInfo.songmid || c.musicInfo.copyrightId || c.musicInfo.hash
    console.log('TRY', c.source, id, c.musicInfo.name)
    try {
      const url = await handlers[0]({
        source: c.source,
        action: 'musicUrl',
        info: { musicInfo: c.musicInfo, type: c.type },
      })
      if (typeof url !== 'string' || !/^https?:/.test(url)) {
        console.log('RESULT_NOT_URL', typeof url, url && String(url).slice(0, 80))
        continue
      }
      const probe = await probeAudio(url)
      console.log(JSON.stringify({
        ok: true,
        stage: 'musicUrl+probe',
        source: c.source,
        songName: c.musicInfo.name,
        quality: c.type,
        host: probe.host,
        protocol: probe.protocol,
        httpStatus: probe.statusCode,
        contentType: probe.contentType,
        contentLength: probe.contentLength,
        urlLength: url.length,
      }, null, 2))
      return
    } catch (e) {
      lastErr = e
      console.log('FAIL', c.source, e && (e.message || String(e)))
    }
  }

  console.log(JSON.stringify({
    ok: false,
    stage: 'musicUrl',
    error: (lastErr && lastErr.message) || 'all failed',
    requestCount: requestLog.length,
  }, null, 2))
  process.exit(4)
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, stage: 'runtime', error: e.message }))
  process.exit(1)
})
