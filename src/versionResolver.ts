// src/versionResolver.ts
// Fetches the LATEST version of every tool from official APIs at install time.
// If the API is unreachable it falls back to a known good version.

import * as https from "https";
import { OS } from "./languages";

// ── Generic JSON fetcher with redirect support ────────────────────

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const makeRequest = (currentUrl: string) => {
      https.get(currentUrl, { headers: { "User-Agent": "LangSetup-VSCode/1.0", "Accept": "application/json" } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode ?? 0)) {
          const loc = res.headers.location;
          if (loc) { makeRequest(loc); return; }
        }
        if ((res.statusCode ?? 0) !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error("Invalid JSON")); }
        });
        res.on("error", reject);
      }).on("error", reject);
    };
    makeRequest(url);
  });
}

// ── Return type ───────────────────────────────────────────────────

export interface ResolvedDownload {
  name: string;
  version: string;
  url: string;
  filename: string;
  note: string;
}

// ── 1. Oracle JDK — latest LTS ───────────────────────────────────

export async function resolveOracleJDK(os: OS): Promise<ResolvedDownload> {
  try {
    const data = await fetchJson(
      "https://api.foojay.io/disco/v3.0/major_versions?ea=false&maintained=true&include_versions=false"
    );
    const ltsVersions: number[] = data.result
      .filter((v: any) => v.term_of_support === "LTS")
      .map((v: any) => v.major_version as number);
    const latestLTS = Math.max(...ltsVersions);
    const version = String(latestLTS);
    const ext = os === "windows" ? "msi" : "dmg";
    const url = os === "windows"
      ? `https://download.oracle.com/java/${version}/latest/jdk-${version}_windows-x64_bin.msi`
      : `https://download.oracle.com/java/${version}/latest/jdk-${version}_macos-x64_bin.dmg`;
    return {
      name: `Oracle JDK ${version} LTS (official, latest)`,
      version,
      url,
      filename: `OracleJDK-${version}-setup.${ext}`,
      note: os === "windows"
        ? "Run the installer — JAVA_HOME is set automatically. Restart VS Code when done."
        : "Open the .dmg and run the .pkg inside — JAVA_HOME is set automatically.",
    };
  } catch {
    const version = "25";
    const ext = os === "windows" ? "msi" : "dmg";
    return {
      name: `Oracle JDK ${version} LTS (official)`,
      version,
      url: os === "windows"
        ? `https://download.oracle.com/java/${version}/latest/jdk-${version}_windows-x64_bin.msi`
        : `https://download.oracle.com/java/${version}/latest/jdk-${version}_macos-x64_bin.dmg`,
      filename: `OracleJDK-${version}-setup.${ext}`,
      note: "Run the installer — JAVA_HOME is set automatically. Restart VS Code.",
    };
  }
}

// ── 2. Python — latest stable 3.x ────────────────────────────────

export async function resolvePython(os: OS): Promise<ResolvedDownload> {
  try {
    const data: any[] = await fetchJson(
      "https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false&version=3"
    );
    const latest = data
      .filter((r) => !r.is_devrelease && !r.pre_release && r.name.startsWith("Python 3"))
      .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())[0];
    const version = latest.name.replace("Python ", "").trim();
    const ext = os === "windows" ? "exe" : "pkg";
    const url = os === "windows"
      ? `https://www.python.org/ftp/python/${version}/python-${version}-amd64.exe`
      : `https://www.python.org/ftp/python/${version}/python-${version}-macos11.pkg`;
    return {
      name: `Python ${version} (latest stable)`,
      version,
      url,
      filename: `python-${version}-setup.${ext}`,
      note: os === "windows"
        ? "⚠ IMPORTANT: On the FIRST screen — tick 'Add Python to PATH' before clicking Install Now!"
        : "Run the .pkg installer — Python is added to PATH automatically.",
    };
  } catch {
    const version = "3.13.0";
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `Python ${version}`,
      version,
      url: os === "windows"
        ? `https://www.python.org/ftp/python/${version}/python-${version}-amd64.exe`
        : `https://www.python.org/ftp/python/${version}/python-${version}-macos11.pkg`,
      filename: `python-${version}-setup.${ext}`,
      note: os === "windows"
        ? "⚠ IMPORTANT: Tick 'Add Python to PATH' on the first screen!"
        : "Run the .pkg installer.",
    };
  }
}

// ── 3. Node.js — latest LTS ──────────────────────────────────────

export async function resolveNodeJS(os: OS): Promise<ResolvedDownload> {
  try {
    const data: any[] = await fetchJson("https://nodejs.org/dist/index.json");
    const latest = data.find((v) => v.lts !== false);
    const version = latest.version.replace("v", "");
    const ext = os === "windows" ? "msi" : "pkg";
    const url = os === "windows"
      ? `https://nodejs.org/dist/v${version}/node-v${version}-x64.msi`
      : `https://nodejs.org/dist/v${version}/node-v${version}.pkg`;
    return {
      name: `Node.js ${version} LTS (latest)`,
      version,
      url,
      filename: `nodejs-${version}-setup.${ext}`,
      note: "Run the installer — node and npm are added to PATH automatically.",
    };
  } catch {
    const version = "20.18.0";
    const ext = os === "windows" ? "msi" : "pkg";
    return {
      name: `Node.js ${version} LTS`,
      version,
      url: os === "windows"
        ? `https://nodejs.org/dist/v${version}/node-v${version}-x64.msi`
        : `https://nodejs.org/dist/v${version}/node-v${version}.pkg`,
      filename: `nodejs-${version}-setup.${ext}`,
      note: "Run the installer — node and npm are added to PATH automatically.",
    };
  }
}

// ── 4. Go — latest stable ─────────────────────────────────────────

export async function resolveGo(os: OS): Promise<ResolvedDownload> {
  try {
    const data: any[] = await fetchJson("https://go.dev/dl/?mode=json&include=stable");
    const version = data[0].version.replace("go", "");
    const ext = os === "windows" ? "msi" : "pkg";
    const url = os === "windows"
      ? `https://go.dev/dl/go${version}.windows-amd64.msi`
      : `https://go.dev/dl/go${version}.darwin-amd64.pkg`;
    return {
      name: `Go ${version} (latest stable)`,
      version,
      url,
      filename: `go-${version}-setup.${ext}`,
      note: "Run the installer — Go is added to PATH automatically. Restart VS Code.",
    };
  } catch {
    const version = "1.23.4";
    const ext = os === "windows" ? "msi" : "pkg";
    return {
      name: `Go ${version}`,
      version,
      url: os === "windows"
        ? `https://go.dev/dl/go${version}.windows-amd64.msi`
        : `https://go.dev/dl/go${version}.darwin-amd64.pkg`,
      filename: `go-${version}-setup.${ext}`,
      note: "Run the installer — Go is added to PATH automatically.",
    };
  }
}

// ── 5. .NET SDK — latest LTS ─────────────────────────────────────

export async function resolveDotNet(os: OS): Promise<ResolvedDownload> {
  try {
    const index: any = await fetchJson(
      "https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json"
    );
    const ltsChannels = index["releases-index"]
      .filter((r: any) => r["support-phase"] === "active" && r["release-type"] === "lts")
      .sort((a: any, b: any) => parseFloat(b["channel-version"]) - parseFloat(a["channel-version"]));
    const channelData: any = await fetchJson(ltsChannels[0]["releases.json"]);
    const latestRelease = channelData.releases[0];
    const sdkVersion: string = latestRelease.sdk.version;
    const ext = os === "windows" ? "exe" : "pkg";
    const winFile = latestRelease.sdk.files?.find((f: any) => f.rid === "win-x64" && f.name.endsWith(".exe"));
    const macFile = latestRelease.sdk.files?.find((f: any) => f.rid === "osx-x64" && f.name.endsWith(".pkg"));
    const url = os === "windows" ? (winFile?.url ?? "") : (macFile?.url ?? "");
    return {
      name: `.NET ${sdkVersion} SDK (latest LTS)`,
      version: sdkVersion,
      url,
      filename: `dotnet-${sdkVersion}-sdk-setup.${ext}`,
      note: "Run the installer — dotnet command is added to PATH automatically. Restart VS Code.",
    };
  } catch {
    const version = "8.0.404";
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `.NET ${version} SDK`,
      version,
      url: os === "windows"
        ? `https://download.visualstudio.microsoft.com/download/pr/93961dfb-9f45-4b08-b931-78d557634726/d9b5e5ca4e37d0e6e34c427cd7b73fa7/dotnet-sdk-${version}-win-x64.exe`
        : `https://download.visualstudio.microsoft.com/download/pr/e823784b-9b7a-4071-9a2d-6e18190ed245/8e94aecc9f0f0daad68abcd7124b4fdd/dotnet-sdk-${version}-osx-x64.pkg`,
      filename: `dotnet-${version}-sdk-setup.${ext}`,
      note: "Run the installer — dotnet is added to PATH automatically.",
    };
  }
}

// ── 6. MSYS2 — latest (for C/C++ on Windows) ─────────────────────

export async function resolveMSYS2(): Promise<ResolvedDownload> {
  try {
    const release: any = await fetchJson(
      "https://api.github.com/repos/msys2/msys2-installer/releases/latest"
    );
    const asset = release.assets?.find((a: any) =>
      a.name.endsWith(".exe") && a.name.includes("x86_64")
    );
    const version: string = release.tag_name ?? "latest";
    return {
      name: `MSYS2 ${version} (MinGW-w64 / GCC for Windows)`,
      version,
      url: asset?.browser_download_url ?? "https://repo.msys2.org/distrib/msys2-x86_64-latest.exe",
      filename: `msys2-${version}-setup.exe`,
      note: "Install MSYS2 → open 'MSYS2 UCRT64' from Start Menu → run: pacman -S mingw-w64-ucrt-x86_64-gcc",
    };
  } catch {
    return {
      name: "MSYS2 latest (MinGW-w64 / GCC for Windows)",
      version: "latest",
      url: "https://repo.msys2.org/distrib/msys2-x86_64-latest.exe",
      filename: "msys2-latest-setup.exe",
      note: "Install MSYS2 → open 'MSYS2 UCRT64' → run: pacman -S mingw-w64-ucrt-x86_64-gcc",
    };
  }
}

// ── 7. Flutter — latest stable ───────────────────────────────────

export async function resolveFlutter(os: OS): Promise<ResolvedDownload> {
  try {
    const platform = os === "windows" ? "windows" : os === "mac" ? "macos" : "linux";
    const data: any = await fetchJson(
      `https://storage.googleapis.com/flutter_infra_release/releases/releases_${platform}.json`
    );
    const latestHash = data.current_release.stable;
    const latestBuild = data.releases.find((r: any) => r.hash === latestHash);
    const version: string = latestBuild?.version ?? "3.24.5";
    const archiveUrl = latestBuild?.archive
      ? `https://storage.googleapis.com/flutter_infra_release/releases/${latestBuild.archive}`
      : `https://storage.googleapis.com/flutter_infra_release/releases/stable/${platform}/flutter_${platform}_${version}-stable.zip`;
    return {
      name: `Flutter ${version} stable (includes Dart)`,
      version,
      url: archiveUrl,
      filename: `flutter-${version}-${os}.zip`,
      note: os === "windows"
        ? "Extract to C:\\flutter → add C:\\flutter\\bin to PATH → run: flutter doctor in terminal"
        : "Extract to ~/flutter → add ~/flutter/bin to PATH → run: flutter doctor",
    };
  } catch {
    const version = "3.24.5";
    const platform = os === "windows" ? "windows" : os === "mac" ? "macos" : "linux";
    return {
      name: `Flutter ${version} stable (includes Dart)`,
      version,
      url: `https://storage.googleapis.com/flutter_infra_release/releases/stable/${platform}/flutter_${platform}_${version}-stable.zip`,
      filename: `flutter-${version}-${os}.zip`,
      note: "Extract and add flutter/bin to PATH → run: flutter doctor",
    };
  }
}

// ── 8. Ruby — latest RubyInstaller (Windows) ─────────────────────

export async function resolveRuby(): Promise<ResolvedDownload> {
  try {
    const release: any = await fetchJson(
      "https://api.github.com/repos/oneclick/rubyinstaller2/releases/latest"
    );
    const asset = release.assets?.find((a: any) =>
      a.name.includes("devkit") && a.name.includes("x64") && a.name.endsWith(".exe")
    );
    const version: string = release.tag_name?.replace("RubyInstaller-", "").split("-")[0] ?? "3.3.6";
    return {
      name: `RubyInstaller ${version} with DevKit (Windows)`,
      version,
      url: asset?.browser_download_url ?? `https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-${version}-1/rubyinstaller-devkit-${version}-1-x64.exe`,
      filename: `rubyinstaller-${version}-setup.exe`,
      note: "Run the installer — at the end press Enter in the terminal to install MSYS2. Restart VS Code.",
    };
  } catch {
    const version = "3.3.6";
    return {
      name: `RubyInstaller ${version} with DevKit`,
      version,
      url: `https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-${version}-1/rubyinstaller-devkit-${version}-1-x64.exe`,
      filename: `rubyinstaller-${version}-setup.exe`,
      note: "Run the installer — press Enter at the end. Restart VS Code.",
    };
  }
}

// ── 9. Rust — always latest via rustup ───────────────────────────

export function resolveRust(os: OS): ResolvedDownload {
  if (os === "windows") {
    return {
      name: "Rustup (always installs latest Rust)",
      version: "latest",
      url: "https://win.rustup.rs/x86_64",
      filename: "rustup-init.exe",
      note: "Run the .exe → press 1 for default install → installs latest rustc, cargo and rustup",
    };
  }
  return {
    name: "Rustup (always installs latest Rust)",
    version: "latest",
    url: "https://sh.rustup.rs",
    filename: "rustup-init.sh",
    note: "Open Terminal and run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
  };
}

// ── 10. R — latest release ───────────────────────────────────────

export async function resolveR(os: OS): Promise<ResolvedDownload> {
  try {
    const versionText = await new Promise<string>((resolve, reject) => {
      https.get("https://cran.r-project.org/bin/windows/base/release.htm", (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }).on("error", reject);
    });
    const match = versionText.match(/R-([\d.]+)-win\.exe/);
    const version = match ? match[1] : "4.4.2";
    const ext = os === "windows" ? "exe" : "pkg";
    const url = os === "windows"
      ? `https://cran.r-project.org/bin/windows/base/R-${version}-win.exe`
      : `https://cran.r-project.org/bin/macosx/big-sur-arm64/base/R-${version}-arm64.pkg`;
    return {
      name: `R ${version} (latest)`,
      version,
      url,
      filename: `R-${version}-setup.${ext}`,
      note: "Run installer → then in VS Code terminal run: install.packages('languageserver') for IntelliSense",
    };
  } catch {
    const version = "4.4.2";
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `R ${version}`,
      version,
      url: os === "windows"
        ? `https://cran.r-project.org/bin/windows/base/R-${version}-win.exe`
        : `https://cran.r-project.org/bin/macosx/big-sur-arm64/base/R-${version}-arm64.pkg`,
      filename: `R-${version}-setup.${ext}`,
      note: "Run installer then: install.packages('languageserver') in R.",
    };
  }
}

// ── 11. Swift — latest release ───────────────────────────────────

export async function resolveSwift(os: OS): Promise<ResolvedDownload> {
  try {
    const release: any = await fetchJson(
      "https://api.github.com/repos/apple/swift/releases/latest"
    );
    const version: string = release.tag_name?.replace("swift-", "").replace("-RELEASE", "") ?? "5.10";
    const ext = os === "windows" ? "exe" : "pkg";
    const url = os === "windows"
      ? `https://download.swift.org/swift-${version}-release/windows10/swift-${version}-RELEASE/swift-${version}-RELEASE-windows10.exe`
      : `https://download.swift.org/swift-${version}-release/xcode/swift-${version}-RELEASE/swift-${version}-RELEASE-osx.pkg`;
    return {
      name: `Swift ${version} (latest)`,
      version,
      url,
      filename: `swift-${version}-setup.${ext}`,
      note: os === "mac"
        ? "Install Xcode from Mac App Store for the best Swift experience."
        : "Run installer — Swift toolchain added to PATH. Restart VS Code.",
    };
  } catch {
    const version = "5.10";
    return {
      name: `Swift ${version}`,
      version,
      url: os === "windows"
        ? `https://download.swift.org/swift-${version}-release/windows10/swift-${version}-RELEASE/swift-${version}-RELEASE-windows10.exe`
        : `https://download.swift.org/swift-${version}-release/xcode/swift-${version}-RELEASE/swift-${version}-RELEASE-osx.pkg`,
      filename: `swift-${version}-setup.${os === "windows" ? "exe" : "pkg"}`,
      note: "Run installer — Swift toolchain added to PATH.",
    };
  }
}
