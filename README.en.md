**语言 / Language:** [中文](README.md) | English

[aiv123.com](https://aiv123.com/) · AI tools directory, 600+ tools in one place

## 🚀 Recommended: [ofox.ai](https://ofox.io/x/aiv123)

> **In short**: One account for the latest GPT / Claude / Gemini and **100+** top models. First top-up gets an extra **$3** credit.

Text, image, video, and embeddings in one place. Caching supported — repeat calls stay cheaper and faster.

[👉 Sign up](https://ofox.io/x/aiv123) · Global dedicated lines · Enterprise SLA · No conversation retention

| ⚡️ Faster & Leaner | 🧠 Models & Modalities | 🛡️ Privacy |
|:---:|:---:|:---:|
| Global lines, enterprise SLA, plus caching | 100+ models · text / image / video / embeddings | No conversation retention |

## ☕ Buy Me a Coke

Open source takes effort — sponsorship is welcome:  
👉 [爱发电 / Afdian](https://ifdian.net/a/shellsec)

---

<p align="center"><a href="https://github.com/shellsec/lx-music-eink"><img width="200" src="https://github.com/lyswhut/lx-music-mobile/blob/master/doc/images/icon.png" alt="lx-music logo"></a></p>

<h1 align="center">Luoxue Music E-ink Edition</h1>

<p align="center">
  <a href="https://github.com/shellsec/lx-music-eink/releases"><img src="https://img.shields.io/github/release/shellsec/lx-music-eink" alt="Release version"></a>
  <a href="https://github.com/facebook/react-native"><img src="https://img.shields.io/github/package-json/dependency-version/lyswhut/lx-music-mobile/react-native/master" alt="React native version"></a>
  <a href="https://github.com/lyswhut/lx-music-mobile/tree/dev"><img src="https://img.shields.io/github/package-json/v/lyswhut/lx-music-mobile/dev" alt="Upstream dev version"></a>
</p>

<p align="center">Build status: see upstream <a href="https://github.com/lyswhut/lx-music-mobile">LX Music Mobile</a></p>

<p align="center">Luoxue Music E-ink Edition, built with React Native, forked from LX Music Mobile.</p>

### Why this build

**Sources are built in. Install and play; if one fails, it switches automatically.**

Verified on Koudaoyue / 口袋阅 (Android 8.1, `armeabi-v7a` only): install and playback passed. This repo ships an Android APK; it is **not** a hardware display driver.

Home screen (Luoxue Music E-ink Edition):

![Koudaoyue home](docs/screenshots/home.jpg)

Player:

![Player — Danche](docs/screenshots/player.jpg)

Charts:

![Charts](docs/screenshots/charts.jpg)

### 1. Verified on this repo (device test)

| Device | OS | ABI | APK | Notes |
|---|---|---|---|---|
| Koudaoyue / 口袋阅 (1st gen) | Android 8.1 | `armeabi-v7a` | `lx-music-mobile-v1.9.1-armeabi-v7a.apk` | Install + playback verified in this repo |

### 2. Pick APK by ABI

Root-level APKs are **local build artifacts** and are gitignored by default (build with the commands below, or take them from Releases).

| APK | ABI | Use for |
|---|---|---|
| `lx-music-mobile-v1.9.1-armeabi-v7a.apk` (~23MB) | `armeabi-v7a` | 32-bit-only devices such as Koudaoyue |
| `lx-music-mobile-v1.9.1-arm64-v8a.apk` (~26MB) | `arm64-v8a` | Pure 64-bit / arm64-first e-ink devices |

#### Download (accelerated)

- armeabi-v7a (32-bit, e.g. Koudaoyue): [Accelerated download v7a](https://gh-proxy.org/https://github.com/shellsec/lx-music-eink/releases/download/v1.9.1/lx-music-mobile-v1.9.1-armeabi-v7a.apk)
- arm64-v8a (64-bit e-ink): [Accelerated download arm64](https://gh-proxy.org/https://github.com/shellsec/lx-music-eink/releases/download/v1.9.1/lx-music-mobile-v1.9.1-arm64-v8a.apk)

Package `cn.toside.music.mobile`, minSdk 21 (Android 5.0+). A 32-bit-only APK will not install on pure 64-bit devices; an arm64-only APK will not install on Koudaoyue with only `armeabi-v7a`. If unsure, check on-device with CPU-Z / About phone, or `adb shell getprop ro.product.cpu.abi`.

### 3. Common Android e-ink devices (public specs only)

Public **model / OS / ABI** notes only — **not tested in this repo**, not a compatibility guarantee. Pick APK by **ABI + Android ≥ 5.0** only (not screen size). If ABI is unpublished, suggested APK is “ABI unknown — check on device first”.

| Model | OS | ABI | Suggested APK | Notes (not verified here + source) |
|---|---|---|---|---|
| Koudaoyue 2 / 口袋阅二代 | Custom 64-bit Android Go | ABI not published; check on device | ABI unknown — check on device first | [Sina review: 口袋阅2](https://zhongce.sina.com.cn/interface/article/view/69740/), [Elecfans: quad-core A53](https://m.elecfans.com/article/1136524.html) |
| Onyx BOOX Go 7 | Open Android 13 | `arm64-v8a` (CPU-Z: `aarch64`) | `lx-music-mobile-v1.9.1-arm64-v8a.apk` | [Read with Pro: BOOX Go 7](https://www.readwithpro.com/devices/boox-go-7) (Snapdragon 750G / aarch64) |
| Onyx BOOX Palma | Open Android 11 | ABI not published; check on device | ABI unknown — check on device first | [Temblast: Onyx Boox Models](https://www.temblast.com/ref/onyx.htm), [Device Info HW: Palma](http://www.deviceinfohw.ru/devices/item.php?item=122060) (SDM662) |
| Onyx BOOX Palma 2 | Open Android 13 | ABI not published; check on device | ABI unknown — check on device first | [Temblast: Onyx Boox Models](https://www.temblast.com/ref/onyx.htm) |
| Onyx BOOX Note Air3 / Note Air3 C | Open Android 12 | ABI not published; check on device | ABI unknown — check on device first | [BOOX store: Note Air3](https://shop.boox.com/zh/products/boox-note-air3), [Temblast: Onyx Boox Models](https://www.temblast.com/ref/onyx.htm) |
| Onyx BOOX Go Color 7 | Open Android 12 | ABI not published; check on device | ABI unknown — check on device first | [Temblast: Onyx Boox Models](https://www.temblast.com/ref/onyx.htm) |
| Onyx BOOX Tab Ultra C Pro | Open Android 12 | ABI not published; check on device | ABI unknown — check on device first | [BOOX store: Tab Ultra C Pro](https://shop.boox.com/zh/products/tabultracpro) |
| Hisense A9 | Ink OS based on Android 11 (open / sideload OK) | `arm64-v8a` (device dump; also lists v7a compatibility) | `lx-music-mobile-v1.9.1-arm64-v8a.apk` | [aimindseye/hisense-a9 `deviceInfo.md`](https://github.com/aimindseye/hisense-a9/blob/main/deviceInfo.md), [IT Home: Hisense A9](https://www.ithome.com/0/617/918.htm) |
| Hisense A5C | Vision 7.0 (Android 9) | ABI not published; check on device | ABI unknown — check on device first | [Read with Pro: Hisense A5C](https://www.readwithpro.com/devices/hisense-a5c), [Yesky: A5C specs](https://product.yesky.com/product/1093/1093829/param.shtml) |
| Moaan inkPalm 5 / 墨案迷你阅 | Android 8.1 | `armeabi-v7a` (public sources: 32-bit ARM / Cortex-A7) | `lx-music-mobile-v1.9.1-armeabi-v7a.apk` | [qwerty12/inkPalm-5-EPD105-root](https://github.com/qwerty12/inkPalm-5-EPD105-root) (Allwinner 32-bit ARM B300), [MOAAN inkPalm5 manual](https://manuals.plus/m/1013a4ce313dbb06c0c9da76eea48db9f3c0faeabd9d3fb023a90aabf32faa17_optim.pdf) |
| Moaan inkPalm Plus / 墨案迷你阅 Plus | Open Android 11 | ABI not published; check on device | ABI unknown — check on device first | [Tencent News](https://news.qq.com/rain/a/20220601A048J500), [IT Home: Plus update](https://www.ithome.com/0/708/108.htm) |
| Bigme B751 / B751C | Open Android 11 | ABI not published; check on device | ABI unknown — check on device first | [Bigme store: B751](https://store.bigme.vip/products/bigme-7inch-b751-black-white-e-reader), [eWritable: B751C](https://ewritable.net/brands/bigme/tablets/bigme-b751c/) (Helio P35) |
| Bigme B751C S | Open Android 14 | ABI not published; check on device | ABI unknown — check on device first | [Daily Gadget: B751C S](https://daily-gadget.net/smartphone_tablet/103643/), [Read with Pro: B751C](https://www.readwithpro.com/devices/bigme-b751c) |
| Bigme B7 / B7 Pro | Open Android 14 (confirm per SKU page) | ABI not published; check on device | ABI unknown — check on device first | [Bigme store: B7](https://store.bigme.vip/products/bigme-b7-7-color-epaper-tablet-with-4g-calling), [Read with Pro: related SKUs](https://www.readwithpro.com/devices/bigme-b751c) |
| Meebook M6 / M6C | Open Android 11 | ABI not published; check on device | ABI unknown — check on device first | [Read with Pro: M6](https://www.readwithpro.com/devices/meebook-m6), [Read with Pro: M6C](https://www.readwithpro.com/devices/meebook-m6c) |
| Meebook M8 / M8C | Open Android 14 | ABI not published; check on device | ABI unknown — check on device first | [Good e-Reader: M8](https://goodereader.com/blog/reviews/meebook-m8-e-reader-review), [Read with Pro: M8](https://www.readwithpro.com/devices/meebook-m8) |
| Meebook G7C | Open Android 14 | ABI not published; check on device | ABI unknown — check on device first | [Read with Pro: G7C](https://www.readwithpro.com/devices/meebook-g7c-7-color) |
| iReader Ocean 4 / Ocean 4 Turbo | SmartOS 2.2 (Android-based; major Android version not published) | ABI not published; check on device | ABI unknown — check on device first | [IT Home: Ocean 4](https://www.ithome.com/0/783/530.htm), [Good e-Reader: Ocean 4 Turbo](https://goodereader.com/blog/electronic-readers/new-ocean-4-turbo-series-boasts-faster-displays-more-ergonomic-design) (sideload APK OK) |
| iReader Smart X3 | SmartOS (Android-based; sideload APK possible) | ABI not published; check on device | ABI unknown — check on device first | [Sina review: Smart X3](https://zhongce.sina.com.cn/iframe/article/view/174998/) |
| Hanvon Clear6 Pro / 汉王 Clear6 Pro | Open Android 11 | ABI not published; check on device | ABI unknown — check on device first | [Sina review: Clear 6 Pro](https://zhongce.sina.com.cn/iframe/article/view/186956/) (RK3566) |
| Hanvon N10 / 汉王 N10 | Android 11 | ABI not published; check on device | ABI unknown — check on device first | [iKanchai: N10 review](http://www.ikanchai.com/article/20220707/487800.shtml) |
| Hanvon N10 Pro / N10 Gen2 | Android 14 | ABI not published; check on device | ABI unknown — check on device first | [Hanvon: N10 Gen2](https://www.hw99.com/index.php?a=show&c=index&catid=66&id=389&m=content), [Tencent News: N10 Pro](https://news.qq.com/rain/a/20240808A082E900) |
| iFlytek (Migu) R1 / 科大讯飞 R1 | Custom Android 8.1 (third-party APK often restricted) | ABI not published; check on device | ABI unknown — check on device first | [ZOL: R1 pro specs](https://detail.zol.com.cn/1382/1381915/param.shtml), [einkCN: R1 review](https://einkcn.com/post/933.html) |
| iFlytek office pads (Air / X, etc.) | Custom Android (most SKUs restrict sideload) | ABI not published; check on device | ABI unknown — check on device first | Public notes emphasize install limits; whether this APK can be installed depends on device policy |

**Built-in sources** (default “auto switch”): Flower → Sixyin → Huibq → ikun → Grass → Juhe API → QDY. On play-URL failure, sources rotate in this order; a successful source is preferred only for the current session — after restart, retry starts from Flower again. Playback still follows the upstream LX Music path; charts/search logic are unchanged.

**Install**: put the matching APK into your installer tool’s `File` folder → refresh → choose “Install APK” → tap the file. Needs Android 5.0+, third-party install allowed, and network access.

Rebuild (set `ANDROID_HOME` / `ANDROID_SDK_ROOT` to your SDK, and configure `sdk.dir` in `android/local.properties`):

```bat
cd android
gradlew.bat assembleDebug -PreactNativeArchitectures=armeabi-v7a
gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Outputs land in `android\app\build\outputs\apk\debug\`; you can copy them to the repo root under the same filenames.

### Daily development

```bash
npm install
npm run dev
```

## About

Stack: React Native, Redux. Supported platform: Android 5+. There is currently no plan to support iOS or HarmonyOS NEXT.

- This fork (E-ink Edition) downloads: [GitHub Releases](https://github.com/shellsec/lx-music-eink/releases)
- Upstream LX Music Mobile: [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile)
- Upstream changelog: [CHANGELOG.md](https://github.com/lyswhut/lx-music-mobile/blob/master/CHANGELOG.md)
- FAQ / docs: [LX Music mobile FAQ](https://lyswhut.github.io/lx-music-doc/mobile/faq)
- Desktop app: [lx-music-desktop](https://github.com/lyswhut/lx-music-desktop)
- Sync server: [lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server#readme)

The only official release channel for **this** E-ink Edition APK is [GitHub Releases of this repo](https://github.com/shellsec/lx-music-eink/releases). Do not look for the E-ink APK on the upstream LX Music Mobile Releases page. Third-party mirrors of this project are unofficial.

For the full Chinese product notes, contribution guide, and project license addendum, see [README.md](README.md). Upstream English/Chinese docs and source-setup steps: [use source code](https://lyswhut.github.io/lx-music-doc/mobile/use-source-code).

## License

Based on [Apache License 2.0](https://github.com/lyswhut/lx-music-mobile/blob/master/LICENSE), with the same supplemental terms as upstream LX Music Mobile. The Chinese addendum in [README.md](README.md) is authoritative if there is any conflict.
