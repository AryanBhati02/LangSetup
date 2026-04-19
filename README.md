# LangSetup — One-Click Language Installer for VS Code

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Install any programming language in one click — directly from a sidebar panel in VS Code.
> No browser searches. No YouTube tutorials. No copy-pasting commands.

---

## 🚀 What It Does

When a new programmer wants to code in C, Java, Python, or any other language, they normally have to:
- Search the web for "how to install MinGW / JDK / Python on Windows"
- Download installers manually from multiple websites
- Find and install the right VS Code extensions one by one
- Configure PATH variables

**LangSetup does all of this in one click.**

---

## ✨ Features

- 📦 **Sidebar panel** — click the icon in the Activity Bar, just like Claude Code
- 🔍 **Always latest versions** — fetches current version numbers from official APIs
- ⬇ **Auto-downloads** official setup files to your Downloads folder and opens them
- 🧩 **Auto-installs** all required VS Code extensions silently
- 🖥 **Windows, macOS & Linux** support
- 16 languages supported

---

## 🌐 Supported Languages

| Language | VS Code Extensions | System Tool |
|----------|-------------------|-------------|
| ⚙️ C / C++ | C/C++ IntelliSense, CMake | MSYS2 + GCC (latest) |
| ☕ Java | Java Extension Pack | Oracle JDK LTS (latest) |
| 🐍 Python | Python, Pylance, Jupyter | Python 3 (latest) |
| 🟨 JavaScript | ESLint, Prettier | Node.js LTS (latest) |
| 🔷 TypeScript | TS Next, ESLint | Node.js LTS (latest) |
| 🌐 HTML/CSS | Live Server, Auto-tag | None needed |
| 💜 C# | C# Dev Kit | .NET SDK (latest LTS) |
| 🐘 PHP | Intelephense, Xdebug | XAMPP (latest) |
| 🟣 Kotlin | Kotlin, Java Pack | Oracle JDK LTS (latest) |
| 🧡 Swift | Swift lang | Swift (latest) |
| 💎 Ruby | Ruby LSP | RubyInstaller (latest) |
| 🦀 Rust | rust-analyzer | Rustup (always latest) |
| 🐹 Go | Go official | Go (latest stable) |
| 🎯 Dart/Flutter | Flutter, Dart | Flutter SDK (latest) |
| 📊 R | R support | R (latest) |
| 🌙 Lua | Lua LSP | LuaForWindows |

---

## 📖 How to Use

1. Click the **📦 LangSetup icon** in the left Activity Bar
2. Select your **OS** (Windows / macOS / Linux)
3. **Check** one or more languages
4. Click **Install** → confirm → done ✅

---

## 🛠 Development

```bash
git clone https://github.com/YOUR_USERNAME/langsetup.git
cd langsetup
npm install
npm run compile
# Press F5 in VS Code to test
```

---

## 📄 License

MIT — free to use, modify and distribute.

---

## 👤 Author

Made with ❤️ to help beginners get coding faster.
