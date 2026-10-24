<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>हल्का वर्कस्पेस टर्मिनल।</strong></p>
</div>

<p align="center">
  <a href="../../README.md">English</a> |
  <a href="README.zh-CN.md">简体中文</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.pt-BR.md">Português</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.id.md">Bahasa Indonesia</a> |
  <a href="README.hi.md">हिन्दी</a>
</p>

---

<img src="../../public/preview.webp" alt="Rex वर्कस्पेस टर्मिनल" width="100%" />

Rex एक हल्का, ओपन-सोर्स वर्कस्पेस टर्मिनल है जो Tauri 2 + Rust और React 19 पर बना है। GPU-त्वरित टर्मिनल और कोड एडिटर एक ही तेज़ नेटिव ऐप में, साथ में फ़ाइल एक्सप्लोरर, git ग्राफ सहित सोर्स कंट्रोल और वेब प्रीव्यू पैन भी शामिल है। डिस्क पर लगभग 7-8 MB। कोई टेलीमेट्री नहीं। कोई खाता नहीं।

## फ़ीचर्स

### टर्मिनल

- GPU-त्वरित रेंडरिंग: डिफ़ॉल्ट रूप से WebGPU, फ़ॉलबैक WebGL (libghostty-vt टर्मिनल मॉडल)
- बैकग्राउंड स्ट्रीमिंग के साथ मल्टी-टैब, क्षैतिज और लंबवत स्प्लिट
- शेल इंटीग्रेशन के साथ ब्लॉक-आधारित कमांड इनपुट (OSC 7 / OSC 133)
- `portable-pty` द्वारा नेटिव PTY बैकएंड (zsh, bash, pwsh, fish, cmd)
- इनलाइन खोज, लिंक डिटेक्शन, ट्रू-कलर
- एक्सप्लोरर या डेस्कटॉप से फ़ाइलों को टर्मिनल में ड्रैग करें - शेल-सुरक्षित कोटेड पाथ के रूप में
- प्राइवेट टैब
- Windows पर प्रति-टैब वर्कस्पेस वातावरण (लोकल, या कोई भी इंस्टॉल वाला WSL डिस्ट्रो)
- Spaces लॉन्च के बीच टैब, वर्किंग डायरेक्टरी और स्प्लिट लेआउट पुनर्स्थापित करते हैं
- बंडल `rex` CLI: `rex open <file> --line <n>` किसी भी शेल से फ़ाइलें खोलता है

### कोड एडिटर

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown आदि)
- रेंडर किया गया Markdown साथ ही इमेज, वीडियो, ऑडियो और PDF देखना
- ऑप्ट-इन लैंग्वेज सर्वर समर्थन: डायग्नोस्टिक्स, नेविगेशन, कम्प्लीशन, फ़ॉर्मेटिंग और कस्टम सर्वर
- सेव पर फ़ॉर्मेट (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig, या कस्टम कमांड)
- Vim मोड
- बिल्ट-इन एडिटर थीम: Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub और Xcode

### सोर्स कंट्रोल

- हंक स्टेज / अनस्टेज, कमिट (Cmd+Enter / Ctrl+Enter), अपस्ट्रीम-अवेयर पुश
- ब्रांच डिस्प्ले और चेकआउट, detached HEAD स्थिति सहित
- वास्तविक कमिट ग्राफ वाला git हिस्ट्री पैन (मर्ज और ब्रांच के लिए लेन रेंडरिंग)
- कमिट खोज और फ़िल्टर, रिमोट कमिट पेज पर क्लिक-थ्रू
- वन-क्लिक AI कमिट मैसेज जनरेशन (स्टेज किया गया diff और रिपो नाम एक मुफ़्त कीलेस एंडपॉइंट पर भेजता है)

### फ़ाइल एक्सप्लोरर

- Catppuccin आइकन थीम
- फ़ज़ी खोज, कीबोर्ड नेविगेशन, इनलाइन रीनेम, कॉन्टेक्स्ट एक्शन
- डिस्क पर फ़ाइलें बदलने पर लाइव अपडेट

### वेब प्रीव्यू

- लोकल देव सर्वर को अपने आप पहचानकर प्रीव्यू टैब में खोलता है
- नेटिव चाइल्ड वेबव्यू से बाहरी URL प्रीव्यू

### थीम और कस्टमाइज़ेशन

- ऐप में बनाई गई कस्टम थीम, बिल्ट-इन प्रीसेट और अपनी थीम के बीच स्विच करें
- अपनी थीम बनाएं, साझा करें या कम्युनिटी से इंपोर्ट करें
- एडजस्टेबल ओपैसिटी और ब्लर के साथ बैकग्राउंड इमेज
- एडिटर थीम ऐप थीम से स्वतंत्र है

## इंस्टॉल

नवीनतम इंस्टॉलर [Releases](https://github.com/crynta/terax-ai/releases/latest) पेज पर हैं। Rex वहाँ से ऑटो-अपडेट होता है।

### Windows नोट्स

- डिफ़ॉल्ट शेल डिटेक्शन: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`।
- WSL एक फ़र्स्ट-क्लास वर्कस्पेस वातावरण है, रैप किया हुआ सबप्रोसेस नहीं।
- फ़ोल्डर और ड्राइव के लिए "Open in Rex" कॉन्टेक्स्ट-मेन्यू एंट्री प्रति उपयोगकर्ता इंस्टॉल होती हैं।

### Linux नोट्स

- **Arch / AUR:** `yay -S terax-bin` (या `paru` आदि)। नवीनतम रिलीज़ को फ़ॉलो करता है।
- **NixOS / Nix**: आधिकारिक flake इस्तेमाल करें - `nix profile install github:crynta/terax-ai` (गैर-NixOS), या flake इंपोर्ट करके `inputs.rex.packages.${pkgs.system}.rex` को `environment.systemPackages` में जोड़ें (NixOS)। सरल सेटअप के लिए `nixosModules.rex` आउटपुट भी उपलब्ध है।
- **AppImage:** FUSE चाहिए। बिना: `./Terax_*.AppImage --appimage-extract-and-run`। Wayland पर रेंडरिंग ग्लिच होने पर `WEBKIT_DISABLE_DMABUF_RENDERER=1` आज़माएँ। `.deb` / `.rpm` पैकेज सिस्टम GTK स्टैक से लिंक होते हैं और आमतौर पर बेहतर चलते हैं।

## सोर्स से बिल्ड

**पूर्वापेक्षाएँ**
- Rust (stable), https://rustup.rs
- Node 22+ और [pnpm](https://pnpm.io)
- अपने प्लेटफ़ॉर्म के लिए Tauri पूर्वापेक्षाएँ, https://tauri.app/start/prerequisites/

**चलाना**
```bash
pnpm install
pnpm tauri dev          # डेवलपमेंट
pnpm tauri build        # प्रोडक्शन बंडल
```

**जाँच**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # Rust lint (CI जैसा)
cd src-tauri && cargo nextest run --locked                           # या: cargo test --locked
```

## टेक स्टैक

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand।

## योगदान

Issues और PR का स्वागत है! Issues खोलें, फ़ीचर सुझाएँ या पुल रिक्वेस्ट भेजें। विवरण के लिए [CONTRIBUTING.md](../../CONTRIBUTING.md) और [आर्किटेक्चर दस्तावेज़](../README.md) देखें।

## क्रेडिट

Rex, [Terax](https://github.com/crynta/terax-ai) का फ़ोर्क है, जिसे [@crynta](https://github.com/crynta) ने बनाया और बनाए रखा है। मूल प्रोजेक्ट का सारा श्रेय Crynta को जाता है।

## कोड साइनिंग

<a href="https://signpath.org"><img src="https://avatars.githubusercontent.com/u/34448643?s=200&v=4" width="80" alt="SignPath" align="left" /></a>

Windows बिल्ड [SignPath.io](https://signpath.io) द्वारा दिए गए मुफ़्त कोड साइनिंग सर्टिफ़िकेट से साइन किए जाते हैं, सर्टिफ़िकेट [SignPath Foundation](https://signpath.org) द्वारा।

<br clear="left" />

## लाइसेंस

Rex Apache-2.0 लाइसेंस के तहत लाइसेंस प्राप्त है। हमारी डिपेंडेंसी की जानकारी के लिए [Apache License 2.0](../../LICENSE) देखें।
