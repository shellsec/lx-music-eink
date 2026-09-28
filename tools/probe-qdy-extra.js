const https = require('https')
const http = require('http')

function req(url, opts = {}, redirects = 5) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http
    const rq = lib.request(url, {
      method: opts.method || 'GET',
      headers: opts.headers || {},
      timeout: 20000,
      rejectUnauthorized: false,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        const next = new URL(res.headers.location, url).toString()
        res.resume()
        return resolve(req(next, opts, redirects - 1).then((r) => ({ ...r, via: host(next), redirectStatus: res.statusCode })))
      }
      const c = []
      res.on('data', (d) => c.push(d))
      res.on('end', () => {
        const buf = Buffer.concat(c)
        resolve({ status: res.statusCode, host: host(url), size: buf.length, ctype: res.headers['content-type'], err: null })
      })
    })
    rq.on('error', (e) => resolve({ status: 0, host: host(url), err: e.message }))
    rq.on('timeout', () => { rq.destroy(); resolve({ status: 0, host: host(url), err: 'timeout' }) })
    rq.end()
  })
}
function host(u) { try { return new URL(u).host } catch { return null } }

;(async () => {
  // haitang with redirect follow
  let r = await req('https://musicapi.haitangw.net/music/kw.php?type=mp3&id=7149583&level=standard', { headers: { 'User-Agent': 'LX-Music-Mobile' } })
  console.log('haitang follow', r)

  // nxinxz
  r = await req('http://music.nxinxz.com/kw.php?id=7149583&level=standard&type=mp3', { headers: { 'User-Agent': 'LX-Music-Mobile' } })
  console.log('nxinxz', r)

  // gdstudio with full query like QDY
  r = await req('https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im&theme=light&types=url&source=netease&id=186016&br=128', { headers: { 'User-Agent': 'LX-Music-Mobile', Accept: 'application/json' } })
  console.log('gdstudio netease', r)
})()
