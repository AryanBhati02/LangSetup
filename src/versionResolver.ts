import * as https from "https";
import { OS, ResolvedDownload } from "./types";

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const makeReq = (u: string) => {
      https
        .get(
          u,
          {
            headers: {
              "User-Agent": "LangSetup-VSCode/1.0",
              Accept: "application/json",
            },
          },
          (res) => {
            const code = res.statusCode ?? 0;
            if ([301, 302, 307, 308].includes(code) && res.headers.location) {
              makeReq(res.headers.location);
              return;
            }
            if (code !== 200) {
              reject(new Error(`HTTP ${code} from ${u}`));
              return;
            }
            let raw = "";
            res.on("data", (c: Buffer) => (raw += c.toString()));
            res.on("end", () => {
              try {
                resolve(JSON.parse(raw));
              } catch {
                reject(new Error("Invalid JSON"));
              }
            });
            res.on("error", reject);
          },
        )
        .on("error", reject);
    };
    makeReq(url);
  });
}

export async function resolveOracleJDK(os: OS): Promise<ResolvedDownload> {
  try {
    const data = await fetchJson(
      "https://api.foojay.io/disco/v3.0/major_versions?ea=false&maintained=true&include_versions=false",
    );
    const ltsNums: number[] = (data.result as any[])
      .filter((v: any) => v.term_of_support === "LTS")
      .map((v: any) => Number(v.major_version));
    const v = String(Math.max(...ltsNums));
    const ext = os === "windows" ? "msi" : "dmg";
    return {
      name: `Oracle JDK ${v} LTS (official, latest)`,
      version: v,
      url:
        os === "windows"
          ? `https://download.oracle.com/java/${v}/latest/jdk-${v}_windows-x64_bin.msi`
          : `https://download.oracle.com/java/${v}/latest/jdk-${v}_macos-x64_bin.dmg`,
      filename: `OracleJDK-${v}-setup.${ext}`,
      note:
        os === "windows"
          ? "Run the installer — JAVA_HOME is set automatically. Restart VS Code."
          : "Open the .dmg and run the .pkg inside — JAVA_HOME is set automatically.",
    };
  } catch {
    const v = "25";
    const ext = os === "windows" ? "msi" : "dmg";
    return {
      name: `Oracle JDK ${v} LTS (official)`,
      version: v,
      url:
        os === "windows"
          ? `https://download.oracle.com/java/${v}/latest/jdk-${v}_windows-x64_bin.msi`
          : `https://download.oracle.com/java/${v}/latest/jdk-${v}_macos-x64_bin.dmg`,
      filename: `OracleJDK-${v}-setup.${ext}`,
      note: "Run the installer — JAVA_HOME is set automatically. Restart VS Code.",
    };
  }
}

export async function resolvePython(os: OS): Promise<ResolvedDownload> {
  try {
    const data: any[] = await fetchJson(
      "https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false&version=3",
    );
    const latest = data
      .filter(
        (r: any) =>
          !r.is_devrelease && !r.pre_release && r.name.startsWith("Python 3"),
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.release_date).getTime() -
          new Date(a.release_date).getTime(),
      )[0];
    const v: string = latest.name.replace("Python ", "").trim();
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `Python ${v} (latest stable)`,
      version: v,
      url:
        os === "windows"
          ? `https://www.python.org/ftp/python/${v}/python-${v}-amd64.exe`
          : `https://www.python.org/ftp/python/${v}/python-${v}-macos11.pkg`,
      filename: `python-${v}-setup.${ext}`,
      note:
        os === "windows"
          ? "⚠ IMPORTANT: On the FIRST screen — tick 'Add Python to PATH' before clicking Install Now!"
          : "Run the .pkg installer — Python is added to PATH automatically.",
    };
  } catch {
    const v = "3.13.0";
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `Python ${v}`,
      version: v,
      url:
        os === "windows"
          ? `https://www.python.org/ftp/python/${v}/python-${v}-amd64.exe`
          : `https://www.python.org/ftp/python/${v}/python-${v}-macos11.pkg`,
      filename: `python-${v}-setup.${ext}`,
      note:
        os === "windows"
          ? "⚠ IMPORTANT: Tick 'Add Python to PATH' on the first screen!"
          : "Run the .pkg installer.",
    };
  }
}

export async function resolveNodeJS(os: OS): Promise<ResolvedDownload> {
  try {
    const data: any[] = await fetchJson("https://nodejs.org/dist/index.json");
    const latest = data.find((v: any) => v.lts !== false);
    const v: string = latest.version.replace("v", "");
    const ext = os === "windows" ? "msi" : "pkg";
    return {
      name: `Node.js ${v} LTS (latest)`,
      version: v,
      url:
        os === "windows"
          ? `https://nodejs.org/dist/v${v}/node-v${v}-x64.msi`
          : `https://nodejs.org/dist/v${v}/node-v${v}.pkg`,
      filename: `nodejs-${v}-setup.${ext}`,
      note: "Run the installer — node and npm are added to PATH automatically.",
    };
  } catch {
    const v = "20.18.0";
    const ext = os === "windows" ? "msi" : "pkg";
    return {
      name: `Node.js ${v} LTS`,
      version: v,
      url:
        os === "windows"
          ? `https://nodejs.org/dist/v${v}/node-v${v}-x64.msi`
          : `https://nodejs.org/dist/v${v}/node-v${v}.pkg`,
      filename: `nodejs-${v}-setup.${ext}`,
      note: "Run the installer — node and npm are added to PATH automatically.",
    };
  }
}

export async function resolveGo(os: OS): Promise<ResolvedDownload> {
  try {
    const data: any[] = await fetchJson(
      "https://go.dev/dl/?mode=json&include=stable",
    );
    const v: string = (data[0].version as string).replace("go", "");
    const ext = os === "windows" ? "msi" : "pkg";
    return {
      name: `Go ${v} (latest stable)`,
      version: v,
      url:
        os === "windows"
          ? `https://go.dev/dl/go${v}.windows-amd64.msi`
          : `https://go.dev/dl/go${v}.darwin-amd64.pkg`,
      filename: `go-${v}-setup.${ext}`,
      note: "Run the installer — Go is added to PATH automatically. Restart VS Code.",
    };
  } catch {
    const v = "1.23.4";
    const ext = os === "windows" ? "msi" : "pkg";
    return {
      name: `Go ${v}`,
      version: v,
      url:
        os === "windows"
          ? `https://go.dev/dl/go${v}.windows-amd64.msi`
          : `https://go.dev/dl/go${v}.darwin-amd64.pkg`,
      filename: `go-${v}-setup.${ext}`,
      note: "Run the installer — Go is added to PATH automatically.",
    };
  }
}

export async function resolveDotNet(os: OS): Promise<ResolvedDownload> {
  try {
    const index: any = await fetchJson(
      "https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json",
    );
    const channels: any[] = (index["releases-index"] as any[])
      .filter(
        (r: any) =>
          r["support-phase"] === "active" && r["release-type"] === "lts",
      )
      .sort(
        (a: any, b: any) =>
          parseFloat(b["channel-version"]) - parseFloat(a["channel-version"]),
      );
    const channelData: any = await fetchJson(channels[0]["releases.json"]);
    const release = channelData.releases[0];
    const sdkVersion: string = release.sdk.version;
    const files: any[] = release.sdk.files ?? [];
    const winFile = files.find(
      (f: any) => f.rid === "win-x64" && (f.name as string).endsWith(".exe"),
    );
    const macFile = files.find(
      (f: any) => f.rid === "osx-x64" && (f.name as string).endsWith(".pkg"),
    );
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `.NET ${sdkVersion} SDK (latest LTS)`,
      version: sdkVersion,
      url: os === "windows" ? (winFile?.url ?? "") : (macFile?.url ?? ""),
      filename: `dotnet-${sdkVersion}-sdk-setup.${ext}`,
      note: "Run the installer — dotnet command is added to PATH automatically. Restart VS Code.",
    };
  } catch {
    const v = "8.0.404";
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `.NET ${v} SDK`,
      version: v,
      url:
        os === "windows"
          ? `https://download.visualstudio.microsoft.com/download/pr/93961dfb-9f45-4b08-b931-78d557634726/d9b5e5ca4e37d0e6e34c427cd7b73fa7/dotnet-sdk-${v}-win-x64.exe`
          : `https://download.visualstudio.microsoft.com/download/pr/e823784b-9b7a-4071-9a2d-6e18190ed245/8e94aecc9f0f0daad68abcd7124b4fdd/dotnet-sdk-${v}-osx-x64.pkg`,
      filename: `dotnet-${v}-sdk-setup.${ext}`,
      note: "Run the installer — dotnet is added to PATH automatically.",
    };
  }
}

export async function resolveMSYS2(): Promise<ResolvedDownload> {
  try {
    const release: any = await fetchJson(
      "https://api.github.com/repos/msys2/msys2-installer/releases/latest",
    );
    const assets: any[] = release.assets ?? [];
    const asset = assets.find(
      (a: any) =>
        (a.name as string).endsWith(".exe") &&
        (a.name as string).includes("x86_64"),
    );
    const v: string = release.tag_name ?? "latest";
    return {
      name: `MSYS2 ${v} (MinGW-w64 / GCC for Windows)`,
      version: v,
      url:
        asset?.browser_download_url ??
        "https://repo.msys2.org/distrib/msys2-x86_64-latest.exe",
      filename: `msys2-${v}-setup.exe`,
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

export async function resolveFlutter(os: OS): Promise<ResolvedDownload> {
  try {
    const platform =
      os === "windows" ? "windows" : os === "mac" ? "macos" : "linux";
    const data: any = await fetchJson(
      `https://storage.googleapis.com/flutter_infra_release/releases/releases_${platform}.json`,
    );
    const latestHash: string = data.current_release.stable;
    const build: any = (data.releases as any[]).find(
      (r: any) => r.hash === latestHash,
    );
    const v: string = build?.version ?? "3.24.5";
    const archiveUrl: string = build?.archive
      ? `https://storage.googleapis.com/flutter_infra_release/releases/${build.archive}`
      : `https://storage.googleapis.com/flutter_infra_release/releases/stable/${platform}/flutter_${platform}_${v}-stable.zip`;
    return {
      name: `Flutter ${v} stable (includes Dart)`,
      version: v,
      url: archiveUrl,
      filename: `flutter-${v}-${os}.zip`,
      note:
        os === "windows"
          ? "Extract to C:\\flutter → add C:\\flutter\\bin to PATH → run: flutter doctor"
          : "Extract to ~/flutter → add ~/flutter/bin to PATH → run: flutter doctor",
    };
  } catch {
    const v = "3.24.5";
    const platform =
      os === "windows" ? "windows" : os === "mac" ? "macos" : "linux";
    return {
      name: `Flutter ${v} stable (includes Dart)`,
      version: v,
      url: `https://storage.googleapis.com/flutter_infra_release/releases/stable/${platform}/flutter_${platform}_${v}-stable.zip`,
      filename: `flutter-${v}-${os}.zip`,
      note: "Extract and add flutter/bin to PATH → run: flutter doctor",
    };
  }
}

export async function resolveRuby(): Promise<ResolvedDownload> {
  try {
    const release: any = await fetchJson(
      "https://api.github.com/repos/oneclick/rubyinstaller2/releases/latest",
    );
    const assets: any[] = release.assets ?? [];
    const asset = assets.find(
      (a: any) =>
        (a.name as string).includes("devkit") &&
        (a.name as string).includes("x64") &&
        (a.name as string).endsWith(".exe"),
    );
    const v: string = ((release.tag_name as string) ?? "RubyInstaller-3.3.6-1")
      .replace("RubyInstaller-", "")
      .split("-")[0];
    return {
      name: `RubyInstaller ${v} with DevKit`,
      version: v,
      url:
        asset?.browser_download_url ??
        `https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-${v}-1/rubyinstaller-devkit-${v}-1-x64.exe`,
      filename: `rubyinstaller-${v}-setup.exe`,
      note: "Run the installer — press Enter at the end to install MSYS2. Restart VS Code.",
    };
  } catch {
    const v = "3.3.6";
    return {
      name: `RubyInstaller ${v} with DevKit`,
      version: v,
      url: `https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-${v}-1/rubyinstaller-devkit-${v}-1-x64.exe`,
      filename: `rubyinstaller-${v}-setup.exe`,
      note: "Run the installer — press Enter at the end. Restart VS Code.",
    };
  }
}

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

export async function resolveR(os: OS): Promise<ResolvedDownload> {
  try {
    const html = await new Promise<string>((resolve, reject) => {
      https
        .get(
          "https://cran.r-project.org/bin/windows/base/release.htm",
          (res) => {
            let d = "";
            res.on("data", (c: Buffer) => (d += c.toString()));
            res.on("end", () => resolve(d));
            res.on("error", reject);
          },
        )
        .on("error", reject);
    });
    const match = html.match(/R-([\d.]+)-win\.exe/);
    const v = match ? match[1] : "4.4.2";
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `R ${v} (latest)`,
      version: v,
      url:
        os === "windows"
          ? `https://cran.r-project.org/bin/windows/base/R-${v}-win.exe`
          : `https://cran.r-project.org/bin/macosx/big-sur-arm64/base/R-${v}-arm64.pkg`,
      filename: `R-${v}-setup.${ext}`,
      note: "Run installer → then in R terminal run: install.packages('languageserver') for IntelliSense",
    };
  } catch {
    const v = "4.4.2";
    const ext = os === "windows" ? "exe" : "pkg";
    return {
      name: `R ${v}`,
      version: v,
      url:
        os === "windows"
          ? `https://cran.r-project.org/bin/windows/base/R-${v}-win.exe`
          : `https://cran.r-project.org/bin/macosx/big-sur-arm64/base/R-${v}-arm64.pkg`,
      filename: `R-${v}-setup.${ext}`,
      note: "Run installer then: install.packages('languageserver') in R.",
    };
  }
}

export async function resolveSwift(os: OS): Promise<ResolvedDownload> {
  try {
    const release: any = await fetchJson(
      "https://api.github.com/repos/apple/swift/releases/latest",
    );
    const v: string = (release.tag_name as string)
      .replace("swift-", "")
      .replace("-RELEASE", "");
    return {
      name: `Swift ${v} (latest)`,
      version: v,
      url:
        os === "windows"
          ? `https://download.swift.org/swift-${v}-release/windows10/swift-${v}-RELEASE/swift-${v}-RELEASE-windows10.exe`
          : `https://download.swift.org/swift-${v}-release/xcode/swift-${v}-RELEASE/swift-${v}-RELEASE-osx.pkg`,
      filename: `swift-${v}-setup.${os === "windows" ? "exe" : "pkg"}`,
      note:
        os === "mac"
          ? "Install Xcode from Mac App Store for the best Swift experience."
          : "Run installer — Swift toolchain added to PATH. Restart VS Code.",
    };
  } catch {
    const v = "5.10";
    return {
      name: `Swift ${v}`,
      version: v,
      url:
        os === "windows"
          ? `https://download.swift.org/swift-${v}-release/windows10/swift-${v}-RELEASE/swift-${v}-RELEASE-windows10.exe`
          : `https://download.swift.org/swift-${v}-release/xcode/swift-${v}-RELEASE/swift-${v}-RELEASE-osx.pkg`,
      filename: `swift-${v}-setup.${os === "windows" ? "exe" : "pkg"}`,
      note: "Run installer — Swift toolchain added to PATH.",
    };
  }
}
