package cn.toside.music.mobile.sourceweb;

import fi.iki.elonen.NanoHTTPD;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.Semaphore;

/** A session-scoped HTTP endpoint with no file-system or directory access. */
public final class SourceWebServer extends NanoHTTPD {
  private static final int MAX_BODY_BYTES = 12_000_000;
  public interface Handler { Response handle(String body) throws Exception; }
  private final String host;
  private final String prefix;
  private final String page;
  private final String nonce;
  private final Handler handler;
  private final Semaphore requests = new Semaphore(1);

  public SourceWebServer(String host, String token, String page, Handler handler) {
    super(host, 0);
    this.host = host;
    this.prefix = "/" + token + "/";
    this.nonce = token;
    this.page = page.replace("__SOURCE_WEB_NONCE__", nonce);
    this.handler = handler;
  }

  public String getAccessUrl() { return "http://" + host + ":" + getListeningPort() + prefix; }

  public static Response json(int status, String content) {
    return secure(newFixedLengthResponse(Response.Status.lookup(status), "application/json; charset=utf-8", content));
  }

  private static Response secure(Response response) {
    response.addHeader("Cache-Control", "no-store");
    response.addHeader("X-Content-Type-Options", "nosniff");
    response.addHeader("X-Frame-Options", "DENY");
    response.addHeader("Referrer-Policy", "no-referrer");
    response.addHeader("Connection", "close");
    return response;
  }

  @Override public Response serve(IHTTPSession session) {
    Map<String, String> headers = session.getHeaders();
    String authority = host + ":" + getListeningPort();
    if (!authority.equals(headers.get("host"))) return json(403, "{\"message\":\"访问地址不匹配，请重新扫码\"}");
    String path = session.getUri();
    if (!path.equals(prefix) && !path.equals(prefix + "api")) return json(403, "{\"message\":\"访问链接已失效，请重新扫码\"}");
    if (session.getMethod() == Method.GET && path.equals(prefix)) {
      Response response = secure(newFixedLengthResponse(Response.Status.OK, "text/html; charset=utf-8", page));
      response.addHeader("Content-Security-Policy", "default-src 'none'; script-src 'nonce-" + nonce
        + "'; style-src 'nonce-" + nonce + "'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
      return response;
    }
    if (session.getMethod() != Method.POST || !path.equals(prefix + "api")) return json(405, "{\"message\":\"不支持此操作\"}");
    if (!("http://" + authority).equals(headers.get("origin"))) return json(403, "{\"message\":\"请从扫码打开的网页提交\"}");
    String type = headers.get("content-type");
    if (type == null || !type.split(";")[0].trim().equalsIgnoreCase("application/json")) return json(415, "{\"message\":\"仅接受 JSON 请求\"}");
    if (!requests.tryAcquire()) return json(429, "{\"message\":\"设备正在处理，请稍后重试\"}");
    try {
      String lengthHeader = headers.get("content-length");
      if (lengthHeader == null || headers.containsKey("transfer-encoding")) return json(411, "{\"message\":\"需要请求长度\"}");
      long length;
      try { length = Long.parseLong(lengthHeader); } catch (NumberFormatException error) { return json(400, "{\"message\":\"无效的请求长度\"}"); }
      if (length < 0 || length > MAX_BODY_BYTES) return json(413, "{\"message\":\"请求内容过大\"}");
      ByteArrayOutputStream body = new ByteArrayOutputStream();
      InputStream input = session.getInputStream();
      byte[] buffer = new byte[8192];
      long remaining = length;
      while (remaining > 0) {
        int count = input.read(buffer, 0, (int)Math.min(buffer.length, remaining));
        if (count < 0) return json(400, "{\"message\":\"请求不完整\"}");
        body.write(buffer, 0, count);
        remaining -= count;
      }
      return secure(handler.handle(new String(body.toByteArray(), StandardCharsets.UTF_8)));
    } catch (Exception error) {
      return json(503, "{\"message\":\"设备暂时无法处理，请重新连接\"}");
    } finally { requests.release(); }
  }
}
