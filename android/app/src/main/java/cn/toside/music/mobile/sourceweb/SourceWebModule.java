package cn.toside.music.mobile.sourceweb;

import android.graphics.Bitmap;
import android.util.Base64;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.zxing.common.BitMatrix;
import fi.iki.elonen.NanoHTTPD;
import java.io.ByteArrayOutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.security.SecureRandom;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public final class SourceWebModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private final ReactApplicationContext context;
  private SourceWebServer server;
  private final ConcurrentHashMap<String, Pending> pending = new ConcurrentHashMap<>();
  private static final class Pending {
    final CountDownLatch ready = new CountDownLatch(1);
    volatile NanoHTTPD.Response response;
  }

  public SourceWebModule(ReactApplicationContext context) {
    super(context);
    this.context = context;
    context.addLifecycleEventListener(this);
  }
  @Override public String getName() { return "SourceWebModule"; }
  @ReactMethod public void addListener(String event) {}
  @ReactMethod public void removeListeners(double count) {}

  @ReactMethod public synchronized void start(String host, String page, Promise promise) {
    stopServer();
    try {
      InetAddress address = InetAddress.getByName(host);
      if (!(address instanceof Inet4Address) || address.isLoopbackAddress() || NetworkInterface.getByInetAddress(address) == null) {
        throw new IllegalArgumentException("请连接 Wi-Fi 后再开启 HTTP 网页");
      }
      byte[] random = new byte[16];
      new SecureRandom().nextBytes(random);
      StringBuilder token = new StringBuilder();
      for (byte value : random) token.append(String.format("%02x", value & 255));
      server = new SourceWebServer(host, token.toString(), page, this::handleRequest);
      server.start(10000, true);
      String url = server.getAccessUrl();
      BitMatrix matrix = SourceWebQr.encode(url);
      int width = matrix.getWidth();
      int[] pixels = new int[width * width];
      for (int y = 0; y < width; y++) for (int x = 0; x < width; x++) pixels[y * width + x] = matrix.get(x, y) ? 0xff000000 : 0xffffffff;
      Bitmap bitmap = Bitmap.createBitmap(pixels, width, width, Bitmap.Config.ARGB_8888);
      ByteArrayOutputStream image = new ByteArrayOutputStream();
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, image);
      bitmap.recycle();
      WritableMap result = Arguments.createMap();
      result.putString("url", url);
      result.putString("qrImage", "data:image/png;base64," + Base64.encodeToString(image.toByteArray(), Base64.NO_WRAP));
      promise.resolve(result);
    } catch (Exception error) {
      stopServer();
      promise.reject("WEB_START_FAILED", error.getMessage(), error);
    }
  }

  private NanoHTTPD.Response handleRequest(String body) throws Exception {
    String id = UUID.randomUUID().toString();
    Pending request = new Pending();
    pending.put(id, request);
    try {
      WritableMap event = Arguments.createMap();
      event.putString("id", id);
      event.putString("body", body);
      context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("source-web-request", event);
      if (!request.ready.await(35, TimeUnit.SECONDS)) return SourceWebServer.json(504, "{\"message\":\"设备响应超时，请重试\"}");
      return request.response;
    } finally { pending.remove(id); }
  }

  @ReactMethod public void respond(String id, int status, String body) {
    Pending request = pending.get(id);
    if (request == null) return;
    request.response = SourceWebServer.json(status == 200 ? 200 : 400, body);
    request.ready.countDown();
  }
  @ReactMethod public synchronized void stop(Promise promise) { stopServer(); promise.resolve(null); }
  private synchronized void stopServer() {
    for (Pending request : pending.values()) {
      request.response = SourceWebServer.json(503, "{\"message\":\"HTTP 网页已关闭\"}");
      request.ready.countDown();
    }
    pending.clear();
    if (server != null) { server.stop(); server = null; }
  }
  @Override public void onHostResume() {}
  @Override public void onHostPause() {
    stopServer();
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("source-web-stopped", null);
  }
  @Override public void onHostDestroy() { stopServer(); }
  @Override public void invalidate() {
    stopServer();
    context.removeLifecycleEventListener(this);
    super.invalidate();
  }
}
