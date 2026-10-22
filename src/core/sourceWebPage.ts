/** Self-contained phone page; never loads scripts, fonts, or QR images from a third party. */
export const SOURCE_WEB_PAGE = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>洛雪增强版 · 网页配置</title>
<style nonce="__SOURCE_WEB_NONCE__">
*{box-sizing:border-box}body{margin:0;background:#f5f5f2;color:#191919;font:16px/1.6 system-ui,sans-serif}main{max-width:640px;margin:auto;padding:28px 20px}h1{font-size:26px;margin:0 0 8px}h2{font-size:19px;margin:0 0 12px}p{margin:8px 0}section{background:white;border:1px solid #d3d3cf;border-radius:10px;margin:20px 0;padding:20px}label{display:block;font-weight:600;margin:12px 0 6px}input,textarea,button{font:inherit;width:100%;border:1px solid #aaa;border-radius:5px;padding:12px;background:#fff;color:#111}textarea{resize:vertical}button{background:#171717;color:white;border-color:#171717;margin-top:14px;cursor:pointer;min-height:48px}button:disabled{opacity:.5;cursor:wait}.hint{font-size:14px;color:#555}#result{white-space:pre-wrap;overflow-wrap:anywhere;border-left:3px solid #111;padding:12px;background:#fff}#sources{padding-left:24px;overflow-wrap:anywhere}a{color:inherit}
</style></head><body><main>
<h1>HTTP 网页配置</h1><p>在手机上填写，直接保存到墨水屏设备。</p>
<p class="hint">请保持两台设备连接同一 Wi-Fi，墨水屏上的配置窗口保持打开。完成后请在设备上关闭网页配置。</p>
<p id="result" role="status" aria-live="polite">正在连接设备…</p>
<section><h2>导入自定义源</h2><form id="url-form"><label for="source-url">音源脚本链接</label>
<input id="source-url" type="url" placeholder="粘贴你自己的脚本链接" autocomplete="off" required><button type="submit">导入到设备</button></form>
<form id="script-form"><label for="script-file">或从手机选择脚本文件</label><input id="script-file" type="file" accept=".js,.txt,text/javascript,application/javascript,text/plain">
<label for="script-text">脚本内容</label><textarea id="script-text" rows="5" placeholder="也可以直接粘贴脚本内容" required></textarea><button type="submit">导入脚本</button></form>
<p class="hint">软件不提供音源。请只导入你信任的内容；导入后到设备设置中选择源。</p></section>
<section><h2>订阅更新</h2><form id="subscription-form"><label for="subscription-url">源清单订阅地址</label>
<input id="subscription-url" type="url" placeholder="https://example.com/sources.json" autocomplete="off"><button type="submit">保存订阅地址</button></form>
<p class="hint">地址会保存在设备上。启用多源自动切换后，已导入源全部失败时按需检查订阅；有更新才再重试一轮。留空保存可关闭订阅。</p></section>
<section><h2>设备上的自定义源</h2><ul id="sources"></ul><p id="empty">请导入自定义源</p></section>
<p class="hint">本软件不提供任何音源，用户导入的内容由用户自行负责，请遵守当地法律与版权。</p>
</main><script nonce="__SOURCE_WEB_NONCE__">
(function(){
var result=document.getElementById('result');
function message(text){result.textContent=text;}
async function request(action,value){
var response=await fetch('api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action,value:value})});
var data=await response.json();if(!response.ok)throw new Error(data.message||'请求失败');return data;
}
async function status(){
var data=await request('status');document.getElementById('subscription-url').value=data.subscriptionUrl||'';
var list=document.getElementById('sources');list.textContent='';(data.sources||[]).forEach(function(name){var item=document.createElement('li');item.textContent=name;list.appendChild(item);});
document.getElementById('empty').hidden=!!(data.sources||[]).length;
}
function bind(id,action,value){document.getElementById(id).addEventListener('submit',async function(event){
event.preventDefault();var buttons=document.querySelectorAll('button');buttons.forEach(function(button){button.disabled=true;});message('正在保存到设备…');
try{var data=await request(action,value());message(data.message);await status();}catch(error){message('未完成：'+error.message+'。请确认设备的 HTTP 网页仍然开启，必要时重新扫码。');}
finally{buttons.forEach(function(button){button.disabled=false;});}
});}
bind('url-form','importUrl',function(){return document.getElementById('source-url').value.trim();});
bind('script-form','importScript',function(){return document.getElementById('script-text').value;});
bind('subscription-form','subscription',function(){return document.getElementById('subscription-url').value.trim();});
document.getElementById('script-file').addEventListener('change',function(){var file=this.files[0];if(!file)return;if(file.size>9000000){message('文件不能超过 9 MB');return;}
var reader=new FileReader();reader.onload=function(){document.getElementById('script-text').value=reader.result;};reader.onerror=function(){message('文件读取失败');};reader.readAsText(file);});
status().then(function(){message('已连接设备，可以填写配置。');}).catch(function(){message('无法连接设备，请确认 HTTP 网页已开启并重新扫码。');});
})();
</script></body></html>`
