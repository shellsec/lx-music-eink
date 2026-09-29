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

Public OS/ABI notes only — **not tested in this repo**, not a compatibility guarantee. If ABI is unpublished, check on the device before choosing an APK.

| Model / series | OS (public) | ABI (if known) | Suggested APK | Notes & sources |
|---|---|---|---|---|
| Koudaoyue 2 / 口袋阅二代 | Custom 64-bit Android Go | ABI not named in public docs (only “64-bit OS”); check on device | Check ABI, then pick matching APK | [Sina review: 口袋阅2](https://zhongce.sina.com.cn/interface/article/view/69740/), [Baidu Baike: 口袋阅](https://baike.baidu.com/item/%E5%8F%A3%E8%A2%8B%E9%98%85/23464848) |
| Onyx BOOX (Note / Nova / Leaf / Poke / Max, etc.) | Varies by model; commonly Android 6 / 9 / 10 / 11 / 12 / 13 open Android | Most public pages omit ABI; check on device | Check ABI, then pick matching APK | [BOOX system update page](https://www.boox.com.hk/pages/system-update) (models grouped by Android major version) |
| Onyx BOOX Go 7 | Open Android 13 | CPU-Z reports `aarch64` → `arm64-v8a` | `lx-music-mobile-v1.9.1-arm64-v8a.apk` | [Read with Pro: BOOX Go 7](https://www.readwithpro.com/devices/boox-go-7) (CPU-Z: Snapdragon 750G / aarch64) |
| Hisense A9 | Ink OS based on Android 11 (open / sideload OK) | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [IT Home: Hisense A9 launch](https://www.ithome.com/0/617/918.htm) |
| Hisense A5C | Android P (Vision 7.0) | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [Yesky: Hisense A5C specs](https://product.yesky.com/product/1093/1093829/param.shtml) |
| Moaan inkPalm / 墨案迷你阅 | Android 8.1 | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [Tencent News: Moaan mini Plus hands-on](https://news.qq.com/rain/a/20220601A048J500) (compares base model as Android 8.1) |
| Moaan inkPalm Plus / 墨案迷你阅 Plus | Open Android 11 | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [Tencent News](https://news.qq.com/rain/a/20220601A048J500), [IT Home: Plus software update](https://www.ithome.com/0/708/108.htm) |
| Bigme B751 | Open Android 11 | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [Bigme store: B751](https://store.bigme.vip/products/bigme-7inch-b751-black-white-e-reader), [Good e-Reader: Bigme B751](https://goodereader.com/blog/electronic-readers/first-look-at-the-bigme-b751-e-reader) |
| Bigme B751C S / B7 Pro (newer) | Public sources cite open Android 14 (confirm per SKU) | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [Daily Gadget: B751C S](https://daily-gadget.net/smartphone_tablet/103643/), [Zhihu: Bigme B7 Pro](https://www.zhihu.com/tardis/jm/art/1998434246252069236) |
| Meebook M6C | Open Android 11 | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [Read with Pro: Meebook M6C](https://www.readwithpro.com/devices/meebook-m6c) |
| Meebook M8 / M8C etc. | Open Android 14 (confirm per model page) | ABI not stated publicly; check on device | Check ABI, then pick matching APK | [Read with Pro: Meebook brand](https://www.readwithpro.com/brands/Meebook%20%E7%9A%93%E6%93%8E) |
| iReader / 掌阅 (Ocean / Smart / Light / Neo, etc.) | Custom Android SmartOS; some SKUs allow sideload, some are more locked | ABI not stated publicly; check on device | Check ABI + whether third-party APK install is allowed | [IT Home: Ocean 4](https://www.ithome.com/0/783/530.htm), [Zhihu: iReader buying guide](https://www.zhihu.com/tardis/bd/art/689972947) |

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
