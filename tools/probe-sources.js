/**
 * 实测各内置自定义音源 musicUrl 端点（仅记录主机名 + HTTP 状态，不打印完整签名 URL）
 * 使用常见公开曲目 ID 探测。
 */
const https = require('https')
const http = require('http')
const { URL } = require('url')

const UA = 'lx-music-mobile/1.9.1'

// 公开曲目探测用 ID（非完整带签名播放链）
const SAMPLES = {
  kw: { songmid: '7149583', name: '晴天' },
  wy: { songmid: '186016', name: '晴天' },
  tx: { songmid: '004Z8Ihr0JIu5s', name: '晴天' },
}

function request(url, options = {}) {
  return new Promise((resolve) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 15000,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const buf = Buffer.concat(chunks)
          let body = null
          try { body = JSON.parse(buf.toString('utf8')) } catch { body = buf.toString('utf8').slice(0, 200) }
          resolve({ status: res.statusCode, headers: res.headers, body, size: buf.length })
        })
      }
    )
    req.on('error', (err) => resolve({ status: 0, error: err.message }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }) })
    if (options.body) req.write(options.body)
    req.end()
  })
}

function hostOf(url) {
  try { return new URL(url).host } catch { return '?' }
}

async function probeAudioUrl(audioUrl) {
  if (!audioUrl || typeof audioUrl !== 'string' || !/^https?:\/\//i.test(audioUrl)) {
    return { ok: false, host: null, status: 0, note: 'no url' }
  }
  const host = hostOf(audioUrl)
  // HEAD first, fallback GET range
  let r = await request(audioUrl, {
    method: 'HEAD',
    headers: { 'User-Agent': UA, Range: 'bytes=0-1' },
  })
  if (!r.status || r.status >= 400) {
    r = await request(audioUrl, {
      method: 'GET',
      headers: { 'User-Agent': UA, Range: 'bytes=0-1' },
    })
  }
  const ok = r.status >= 200 && r.status < 400
  return { ok, host, status: r.status || 0, note: r.error || '' }
}

async function extractUrlFromBody(body) {
  if (!body) return null
  if (typeof body === 'string') {
    const m = body.match(/https?:\/\/[^\s"'<>]+/)
    return m ? m[0] : null
  }
  if (body.url) return body.url
  if (body.data?.url) return body.data.url
  if (typeof body.data === 'string' && /^https?:/.test(body.data)) return body.data
  return null
}

const probes = [
  {
    key: 'flower',
    name: '野花',
    async run() {
      const src = 'kw'
      const id = SAMPLES.kw.songmid
      const url = `http://97.64.37.235/flower/v1/url/${src}/${id}/128k`
      const r = await request(url, { headers: { 'User-Agent': UA } })
      const audio = await extractUrlFromBody(r.body)
      const check = await probeAudioUrl(audio)
      return { apiHost: hostOf(url), apiStatus: r.status, apiError: r.error, ...check }
    },
  },
  {
    key: 'huibq',
    name: 'Huibq',
    async run() {
      const src = 'kw'
      const id = SAMPLES.kw.songmid
      const url = `https://lxmusicapi.onrender.com/url/${src}/${id}/128k`
      const r = await request(url, {
        headers: { 'User-Agent': UA, 'X-Request-Key': 'share-v3', 'Content-Type': 'application/json' },
      })
      const audio = await extractUrlFromBody(r.body)
      const check = await probeAudioUrl(audio)
      return { apiHost: hostOf(url), apiStatus: r.status, apiError: r.error, bodyCode: r.body?.code, ...check }
    },
  },
  {
    key: 'ikun',
    name: 'ikun',
    async run() {
      const src = 'kw'
      const id = SAMPLES.kw.songmid
      const url = `https://api.ikunshare.com/url?source=${src}&songId=${id}&quality=128k`
      const r = await request(url, {
        headers: { 'User-Agent': UA, 'Content-Type': 'application/json', 'X-Request-Key': '' },
      })
      const audio = await extractUrlFromBody(r.body)
      const check = await probeAudioUrl(audio)
      return { apiHost: hostOf(url), apiStatus: r.status, apiError: r.error, bodyCode: r.body?.code, ...check }
    },
  },
  {
    key: 'juhe',
    name: 'JuheApi',
    async run() {
      const info = { type: '128k', musicInfo: { songmid: SAMPLES.kw.songmid, name: '晴天', singer: '周杰伦', source: 'kw' } }
      const url = 'https://api.music.lerd.dpdns.org/kw'
      const r = await request(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      })
      const audio = await extractUrlFromBody(r.body)
      const check = await probeAudioUrl(audio)
      return { apiHost: hostOf(url), apiStatus: r.status, apiError: r.error, bodyCode: r.body?.code, ...check }
    },
  },
  {
    key: 'qdy',
    name: 'QDY',
    async run() {
      // QDY 星海主链路：gdstudio
      const url = 'https://music-api.gdstudio.xyz/api.php?types=url&source=kuwo&id=' + SAMPLES.kw.songmid + '&br=128'
      const r = await request(url, { headers: { 'User-Agent': UA } })
      const audio = await extractUrlFromBody(r.body)
      const check = await probeAudioUrl(audio)
      return { apiHost: hostOf(url), apiStatus: r.status, apiError: r.error, ...check }
    },
  },
  {
    key: 'sixyin',
    name: '六音',
    async run() {
      // 六音脚本混淆；探测常见公开端点 / 脚本内可识别主机
      // 先尝试从脚本解出可读主机名片段
      const fs = require('fs')
      const script = fs.readFileSync('E:/GITHUB/lxwear/src/sources/scripts/sixyin.js', 'utf8')
      const hosts = [...script.matchAll(/https?:\\\/\\\/([a-zA-Z0-9._-]+)/g)].map(m => m[1])
      const hosts2 = [...script.matchAll(/https?:\/\/([a-zA-Z0-9._-]+)/g)].map(m => m[1])
      const all = [...new Set([...hosts, ...hosts2])]
      // 若无直接解析，测脚本自身可达性不足则标记 unknown
      if (!all.length) {
        // 尝试运行时常见六音 API（历史公开）
        const candidates = [
          'https://api.sixyin.com',
          'https://www.sixyin.com',
        ]
        for (const base of candidates) {
          const r = await request(base + '/', { headers: { 'User-Agent': UA } })
          if (r.status) return { apiHost: hostOf(base), apiStatus: r.status, apiError: r.error, ok: false, host: null, status: 0, note: 'script obfuscated; host probe only' }
        }
        return { apiHost: null, apiStatus: 0, ok: false, host: null, status: 0, note: 'obfuscated, no clear endpoint' }
      }
      const base = 'https://' + all[0]
      const r = await request(base, { headers: { 'User-Agent': UA } })
      return { apiHost: all[0], apiStatus: r.status, apiError: r.error, ok: false, host: null, status: 0, note: 'hosts=' + all.join(','), foundHosts: all }
    },
  },
  {
    key: 'grass',
    name: '野草',
    async run() {
      // grass 同 flower 系混淆；尝试常见野草端点
      const candidates = [
        `http://97.64.37.235/grass/v1/url/kw/${SAMPLES.kw.songmid}/128k`,
        `http://97.64.37.235/flower/v1/url/kw/${SAMPLES.kw.songmid}/128k`,
      ]
      for (const url of candidates) {
        const r = await request(url, { headers: { 'User-Agent': UA } })
        const audio = await extractUrlFromBody(r.body)
        if (audio || (r.status && r.status !== 404)) {
          const check = await probeAudioUrl(audio)
          return { apiHost: hostOf(url), apiStatus: r.status, apiError: r.error, path: new URL(url).pathname.split('/')[1], ...check }
        }
      }
      return { apiHost: '97.64.37.235', apiStatus: 404, ok: false, host: null, status: 0, note: 'grass/flower endpoints 404' }
    },
  },
]

;(async () => {
  console.log('=== builtin source musicUrl probe (host + HTTP only) ===')
  const results = []
  for (const p of probes) {
    process.stdout.write(`\n[${p.key}] ${p.name} ... `)
    try {
      const r = await p.run()
      results.push({ key: p.key, name: p.name, ...r })
      const playable = r.ok ? 'PLAYABLE' : 'FAIL'
      console.log(`${playable} api=${r.apiHost}:${r.apiStatus} audio=${r.host || '-'}:${r.status || '-'} ${r.note || ''} code=${r.bodyCode ?? ''}`)
    } catch (e) {
      results.push({ key: p.key, name: p.name, ok: false, note: String(e.message || e) })
      console.log('ERROR', e.message)
    }
  }
  const fs = require('fs')
  fs.writeFileSync('E:/GITHUB/lxwear/tools/source-probe-result.json', JSON.stringify(results, null, 2))
  console.log('\n=== summary ===')
  for (const r of results) {
    console.log(`${r.key}\tplayable=${!!r.ok}\tapi=${r.apiHost}:${r.apiStatus}\taudioHost=${r.host || '-'}\taudioStatus=${r.status || '-'}`)
  }
})()
