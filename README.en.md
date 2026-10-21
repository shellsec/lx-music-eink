# LX Music Enhanced

Derived from [lyswhut/lx-music](https://github.com/lyswhut/lx-music) and its mobile application, under Apache-2.0. Original copyright notices are retained; see LICENSE and NOTICE.

## Downloads

Choose an APK for your device. Accelerated downloads use a third-party service; use GitHub if it is unavailable. SHA256SUMS.txt is included in the release.

| Build | Official | Accelerated |
| --- | --- | --- |
| arm64-v8a | [GitHub](https://github.com/shellsec/lx-music-eink/releases/download/v1.9.2-eink.1/lx-music-mobile-v1.9.2-eink.1-arm64-v8a.apk) | [Accelerated](https://ghfast.top/https://github.com/shellsec/lx-music-eink/releases/download/v1.9.2-eink.1/lx-music-mobile-v1.9.2-eink.1-arm64-v8a.apk) |
| armeabi-v7a | [GitHub](https://github.com/shellsec/lx-music-eink/releases/download/v1.9.2-eink.1/lx-music-mobile-v1.9.2-eink.1-armeabi-v7a.apk) | [Accelerated](https://ghfast.top/https://github.com/shellsec/lx-music-eink/releases/download/v1.9.2-eink.1/lx-music-mobile-v1.9.2-eink.1-armeabi-v7a.apk) |
| universal | [GitHub](https://github.com/shellsec/lx-music-eink/releases/download/v1.9.2-eink.1/lx-music-mobile-v1.9.2-eink.1-universal.apk) | [Accelerated](https://ghfast.top/https://github.com/shellsec/lx-music-eink/releases/download/v1.9.2-eink.1/lx-music-mobile-v1.9.2-eink.1-universal.apk) |

[All releases](https://github.com/shellsec/lx-music-eink/releases)

## E-ink device

The photo shows the app installed on an e-ink device. It is not a first-launch screenshot; custom sources must be imported by the user.

<img src="docs/screenshots/home.jpg" width="320" alt="App on an e-ink device">

Import your own custom scripts from local files or URLs in Settings, then select a source. The source list starts empty. Multi-source automatic switching is disabled by default. When selected, failed playback URL requests retry only imported scripts in list order. Use the up and down buttons in source management to persist the retry order.

Save your own HTTPS subscription address in Settings, for example `https://example.com/sources.json`. The address defaults to empty and persists across restarts. Startup never fetches it. Use the manual update button to import or refresh a list containing `id`, `name`, and `url` entries, either as an array or inside a `sources` field.

After all imported sources fail in automatic mode, the app checks the subscription once. Only a changed manifest or script triggers one additional complete retry round. Repeated requests for the same song/address are suppressed for the current session, different songs share a five-minute cooldown, and concurrent checks are merged. Manual updates bypass the cooldown. Network failures keep local scripts. Existing order and unrelated manual imports are preserved; new subscription sources are appended. Clear and save the address to disable subscription updates.

This software provides no music sources. Users are responsible for imported content and must comply with local laws and copyright requirements.
