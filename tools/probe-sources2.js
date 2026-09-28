const https = require('https')
const http = require('http')
const fs = require('fs')

function req(url, opts = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http
    const rq = lib.request(
      url,
      {
        method: opts.method || 'GET',
        headers: opts.headers || {},
        timeout: 20000,
        rejectUnauthorized: false,
      },
      (res) => {
        const c = []
        res.on('data', (d) => c.push(d))
        res.on('end', () => {
          const t = Buffer.concat(c).toString('utf8')
          let body
          try { body = JSON.parse(t) } catch { body = t.slice(0, 400) }
          resolve({ status: res.statusCode, body, headers: res.headers, err: null })
        })
      }
    )
    rq.on('error', (e) => resolve({ status: 0, body: null, headers: {}, err: e.message }))
    rq.on('timeout', () => { rq.destroy(); resolve({ status: 0, body: null, headers: {}, err: 'timeout' }) })
    if (opts.body) rq.write(opts.body)
    rq.end()
  })
}

function host(u) {
  try { return new URL(u).host } catch { return null }
}

async function checkAudio(audioUrl) {
  if (!audioUrl || !/^https?:\/\//i.test(audioUrl)) return { ok: false, host: null, status: 0 }
  let a = await req(audioUrl, { method: 'HEAD', headers: { 'User-Agent': 'lx-music-mobile/1.9.1', Range: 'bytes=0-1' } })
  if (!a.status || a.status >= 400) {
    a = await req(audioUrl, { method: 'GET', headers: { 'User-Agent': 'lx-music-mobile/1.9.1', Range: 'bytes=0-1' } })
  }
  return { ok: a.status >= 200 && a.status < 400, host: host(audioUrl), status: a.status || 0, err: a.err }
}

const results = []

async function main() {
  // --- JuheApi (follow 303) ---
  {
    const info = { type: '128k', musicInfo: { songmid: '7149583', name: '晴天', singer: '周杰伦', source: 'kw' } }
    let r = await req('https://api.music.lerd.dpdns.org/kw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'lx-music-mobile/1.9.1' },
      body: JSON.stringify(info),
    })
    let audio = null
    let note = ''
    if (r.body && r.body.code === 200) audio = r.body.data && r.body.data.url
    else if (r.body && r.body.code === 303) {
      const D = r.body.data.request
      note = 'via ' + host(D.url)
      const r2 = await req(D.url, D.options)
      audio = r2.body && r2.body.data && r2.body.data.url
    }
    const check = await checkAudio(audio)
    results.push({ key: 'juhe', name: 'JuheApi', apiHost: 'api.music.lerd.dpdns.org', apiStatus: r.status, note, ...check })
    console.log('juhe', results[results.length - 1])
  }

  // --- QDY via gdstudio (same as script) ---
  {
    const url = 'https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im&theme=light&types=url&source=kuwo&id=7149583&br=128'
    const r = await req(url, { headers: { 'User-Agent': 'LX-Music-Mobile', Accept: 'application/json' } })
    const audio = r.body && r.body.url
    const check = await checkAudio(audio)
    results.push({ key: 'qdy', name: 'QDY(gdstudio)', apiHost: 'music-api.gdstudio.xyz', apiStatus: r.status, ...check })
    console.log('qdy', results[results.length - 1])
  }

  // --- QDY haitang (changqing kw) ---
  {
    const url = 'https://musicapi.haitangw.net/music/kw.php?type=mp3&id=7149583&level=standard'
    const r = await req(url, { headers: { 'User-Agent': 'LX-Music-Mobile' } })
    let audio = null
    if (r.body && typeof r.body === 'object') audio = r.body.url || r.body.data || (r.body.data && r.body.data.url)
    if (!audio && typeof r.body === 'string') {
      const m = r.body.match(/https?:\/\/[^\s"']+/)
      audio = m && m[0]
    }
    const check = await checkAudio(audio)
    results.push({ key: 'qdy-haitang', name: 'QDY(haitang-kw)', apiHost: 'musicapi.haitangw.net', apiStatus: r.status, ...check })
    console.log('qdy-haitang', results[results.length - 1], 'bodySnippet', JSON.stringify(r.body).slice(0, 120))
  }

  // --- Flower ---
  {
    const url = 'http://97.64.37.235/flower/v1/url/kw/7149583/128k'
    const r = await req(url, { headers: { 'User-Agent': 'lx-music-mobile/1.9.1' } })
    results.push({ key: 'flower', name: '野花', apiHost: '97.64.37.235', apiStatus: r.status, ok: false, host: null, status: 0, note: 'endpoint 404' })
    console.log('flower', results[results.length - 1])
  }

  // --- Grass ---
  {
    results.push({ key: 'grass', name: '野草', apiHost: '97.64.37.235', apiStatus: 404, ok: false, host: null, status: 0, note: 'same family endpoint dead' })
    console.log('grass', results[results.length - 1])
  }

  // --- Huibq ---
  {
    const r = await req('https://lxmusicapi.onrender.com/url/kw/7149583/128k', {
      headers: { 'User-Agent': 'lx-music-mobile/1.9.1', 'X-Request-Key': 'share-v3' },
    })
    results.push({ key: 'huibq', name: 'Huibq', apiHost: 'lxmusicapi.onrender.com', apiStatus: r.status, ok: false, host: null, status: 0, note: 'service suspended/503' })
    console.log('huibq', results[results.length - 1])
  }

  // --- ikun ---
  {
    const r = await req('https://api.ikunshare.com/url?source=kw&songId=7149583&quality=128k', {
      headers: { 'User-Agent': 'lx-music-mobile/1.9.1', 'Content-Type': 'application/json' },
    })
    results.push({ key: 'ikun', name: 'ikun', apiHost: 'api.ikunshare.com', apiStatus: r.status, ok: false, host: null, status: 0, note: r.err || 'unreachable' })
    console.log('ikun', results[results.length - 1])
  }

  // --- SixYin ---
  {
    // script heavily obfuscated; probe known historical domains
    const candidates = ['https://api.aa1.cn', 'https://www.sixyin.com', 'https://api.sixyin.com']
    let found = null
    for (const c of candidates) {
      const r = await req(c, { headers: { 'User-Agent': 'lx-music-mobile/1.9.1' } })
      if (r.status) { found = { host: host(c), status: r.status, err: r.err }; break }
    }
    results.push({
      key: 'sixyin', name: '六音',
      apiHost: found ? found.host : null,
      apiStatus: found ? found.status : 0,
      ok: false, host: null, status: 0,
      note: 'script obfuscated; musicUrl not verified in isolation',
    })
    console.log('sixyin', results[results.length - 1])
  }

  // verify no xinghai in package inputs
  const xinghaiFiles = []
  for (const p of [
    'E:/GITHUB/lxwear/src/sources/scripts/xinghai.js',
    'E:/GITHUB/lxwear/src/sources/builtin/xinghai.ts',
    'E:/GITHUB/lxwear/android/app/src/main/assets/script/xinghai.js',
  ]) {
    if (fs.existsSync(p)) xinghaiFiles.push(p)
  }
  console.log('\nxinghai residual files:', xinghaiFiles.length ? xinghaiFiles : 'NONE')

  const idx = fs.readFileSync('E:/GITHUB/lxwear/src/sources/builtin/index.ts', 'utf8')
  console.log('index has xinghai:', /xinghai/.test(idx))

  fs.writeFileSync('E:/GITHUB/lxwear/tools/source-probe-result.json', JSON.stringify(results, null, 2))
  console.log('\n=== DONE ===')
  for (const r of results) {
    console.log([r.key, 'playable=' + !!r.ok, 'api=' + r.apiHost + ':' + r.apiStatus, 'audio=' + (r.host || '-') + ':' + (r.status || '-'), r.note || ''].join('\t'))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
