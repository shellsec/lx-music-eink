package cn.toside.music.mobile.sourceweb;

import static org.junit.Assert.*;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import java.io.ByteArrayOutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class SourceWebServerTest {
  private SourceWebServer server;
  private String received;
  @Before public void start() throws Exception {
    server = new SourceWebServer("127.0.0.1", "test-session", "<html>test page</html>", body -> {
      received = body;
      return SourceWebServer.json(200, "{\"message\":\"saved\"}");
    });
    server.start(2000, true);
  }
  @After public void stop() { server.stop(); }
  private String request(String method, String path, String extra, String body) throws Exception {
    try (Socket socket = new Socket("127.0.0.1", server.getListeningPort())) {
      socket.setSoTimeout(3000);
      byte[] content = body.getBytes(StandardCharsets.UTF_8);
      String headers = method + " " + path + " HTTP/1.1\r\nHost: 127.0.0.1:" + server.getListeningPort()
        + "\r\nConnection: close\r\n" + extra + (extra.contains("Content-Length:") ? "" : "Content-Length: " + content.length + "\r\n") + "\r\n";
      socket.getOutputStream().write(headers.getBytes(StandardCharsets.UTF_8));
      socket.getOutputStream().write(content);
      socket.getOutputStream().flush();
      ByteArrayOutputStream result = new ByteArrayOutputStream();
      byte[] buffer = new byte[4096];
      int count;
      while ((count = socket.getInputStream().read(buffer)) >= 0) result.write(buffer, 0, count);
      return new String(result.toByteArray(), StandardCharsets.UTF_8);
    }
  }
  private String origin() { return "Origin: http://127.0.0.1:" + server.getListeningPort() + "\r\nContent-Type: application/json\r\n"; }
  @Test public void tokenIsRequired() throws Exception {
    assertTrue(request("GET", "/", "", "").startsWith("HTTP/1.1 403"));
    assertTrue(request("GET", "/old-session/", "", "").startsWith("HTTP/1.1 403"));
    String page = request("GET", "/test-session/", "", "");
    assertTrue(page.startsWith("HTTP/1.1 200"));
    assertTrue(page.contains("test page"));
    assertTrue(page.toLowerCase().contains("content-security-policy:"));
  }
  @Test public void importsRequireSameOriginJson() throws Exception {
    assertTrue(request("POST", "/test-session/api", "Content-Type: application/json\r\n", "{}").startsWith("HTTP/1.1 403"));
    assertTrue(request("POST", "/test-session/api", "Origin: https://example.com\r\nContent-Type: application/json\r\n", "{}").startsWith("HTTP/1.1 403"));
    String result = request("POST", "/test-session/api", origin(), "{\"value\":\"测试\"}");
    assertTrue(result.startsWith("HTTP/1.1 200"));
    assertEquals("{\"value\":\"测试\"}", received);
    assertTrue(result.contains("saved"));
  }
  @Test public void methodsAndBodyTypeAreRestricted() throws Exception {
    assertTrue(request("GET", "/test-session/api", "", "").startsWith("HTTP/1.1 405"));
    String headers = "Origin: http://127.0.0.1:" + server.getListeningPort() + "\r\nContent-Type: text/plain\r\n";
    assertTrue(request("POST", "/test-session/api", headers, "{}").startsWith("HTTP/1.1 415"));
  }
  @Test public void oversizedRequestsAreRejectedBeforeReadingBody() throws Exception {
    assertTrue(request("POST", "/test-session/api", origin() + "Content-Length: 12000001\r\n", "").startsWith("HTTP/1.1 413"));
  }
  @Test public void wrongHostCannotReachThePage() throws Exception {
    assertTrue(request("GET", "/test-session/", "Host: example.com\r\n", "").startsWith("HTTP/1.1 403"));
  }
  @Test public void stoppingClosesThePort() throws Exception {
    int port = server.getListeningPort();
    server.stop();
    try (Socket ignored = new Socket("127.0.0.1", port)) { fail("Server still listening"); }
    catch (java.io.IOException expected) {}
  }
  @Test public void generatedQrDecodesToExactAccessUrl() throws Exception {
    String url = server.getAccessUrl();
    BitMatrix matrix = SourceWebQr.encode(url);
    int width = matrix.getWidth();
    int[] pixels = new int[width * width];
    for (int y = 0; y < width; y++) for (int x = 0; x < width; x++) pixels[y * width + x] = matrix.get(x, y) ? 0xff000000 : 0xffffffff;
    BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(width, width, pixels)));
    assertEquals(url, new QRCodeReader().decode(bitmap).getText());
  }
}
