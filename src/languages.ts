import {
  resolveOracleJDK,
  resolvePython,
  resolveNodeJS,
  resolveGo,
  resolveDotNet,
  resolveMSYS2,
  resolveFlutter,
  resolveRuby,
  resolveRust,
  resolveR,
  resolveSwift,
} from "./versionResolver";
import { OS, ResolvedDownload } from "./types";

export { OS };

export interface Language {
  id: string;
  name: string;
  icon: string;
  description: string;
  vsExtensions: string[];
  resolveDownload?: (os: OS) => Promise<ResolvedDownload | null>;
  linuxCommands?: string[];
  extraNote?: string;
}

const D = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

export const LANGUAGES: Language[] = [
  {
    id: "c",
    name: "C / C++",
    icon: `${D}/cplusplus/cplusplus-original.svg`,
    description: "Latest GCC compiler + IntelliSense & debugger",
    vsExtensions: [
      "ms-vscode.cpptools",
      "ms-vscode.cpptools-extension-pack",
      "ms-vscode.cmake-tools",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "windows") {
        return resolveMSYS2();
      }
      if (os === "mac") {
        return {
          name: "GCC via Homebrew",
          version: "latest",
          url: "https://brew.sh",
          filename: "gcc-mac.txt",
          note: "Open Terminal and run: brew install gcc  (install Homebrew first from brew.sh if needed)",
        };
      }
      return null;
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y build-essential gdb",
    ],
    extraNote:
      "After installing GCC, restart VS Code. Open a .c file and press F5 to run.",
  },

  {
    id: "java",
    name: "Java",
    icon: `${D}/java/java-original.svg`,
    description: "Latest Oracle JDK LTS + debugger, Maven & Spring",
    vsExtensions: [
      "vscjava.vscode-java-pack",
      "vscjava.vscode-spring-initializr",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveOracleJDK(os);
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y openjdk-21-jdk",
    ],
  },

  {
    id: "python",
    name: "Python",
    icon: `${D}/python/python-original.svg`,
    description: "Latest Python 3 with IntelliSense, linting & Jupyter",
    vsExtensions: [
      "ms-python.python",
      "ms-python.vscode-pylance",
      "ms-python.black-formatter",
      "ms-toolsai.jupyter",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolvePython(os);
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv",
    ],
  },

  {
    id: "javascript",
    name: "JavaScript / Node.js",
    icon: `${D}/javascript/javascript-original.svg`,
    description: "Latest Node.js LTS with ESLint & Prettier",
    vsExtensions: [
      "esbenp.prettier-vscode",
      "dbaeumer.vscode-eslint",
      "christian-kohler.npm-intellisense",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveNodeJS(os);
    },
    linuxCommands: [
      "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",
    ],
  },

  {
    id: "typescript",
    name: "TypeScript",
    icon: `${D}/typescript/typescript-original.svg`,
    description: "TypeScript — Node.js installed automatically",
    vsExtensions: [
      "ms-vscode.vscode-typescript-next",
      "esbenp.prettier-vscode",
      "dbaeumer.vscode-eslint",
      "christian-kohler.path-intellisense",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      const node = await resolveNodeJS(os);
      return {
        ...node,
        name: `Node.js ${node.version} LTS (required for TypeScript)`,
        note: node.note + " Then run: npm install -g typescript ts-node",
      };
    },
    linuxCommands: [
      "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -",
      "sudo apt-get install -y nodejs npm",
      "sudo npm install -g typescript ts-node",
    ],
    extraNote:
      "After Node.js installs, run in terminal: npm install -g typescript ts-node",
  },

  {
    id: "html",
    name: "HTML / CSS",
    icon: `${D}/html5/html5-original.svg`,
    description: "Live Server, Emmet & auto-complete — no install needed",
    vsExtensions: [
      "ritwickdey.liveserver",
      "ecmel.vscode-html-css",
      "formulahendry.auto-close-tag",
      "formulahendry.auto-rename-tag",
    ],
    extraNote:
      "No downloads needed! Create a .html file → right-click → Open with Live Server.",
  },

  {
    id: "csharp",
    name: "C# (.NET)",
    icon: `${D}/csharp/csharp-original.svg`,
    description: "Latest .NET SDK with full C# IntelliSense & debugger",
    vsExtensions: [
      "ms-dotnettools.csharp",
      "ms-dotnettools.csdevkit",
      "ms-dotnettools.vscode-dotnet-runtime",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveDotNet(os);
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y dotnet-sdk-8.0",
    ],
    extraNote: "After install, create a project: dotnet new console -n MyApp",
  },

  {
    id: "php",
    name: "PHP",
    icon: `${D}/php/php-original.svg`,
    description: "PHP with IntelliSense, Xdebug & Apache via XAMPP",
    vsExtensions: [
      "bmewburn.vscode-intelephense-client",
      "xdebug.php-debug",
      "neilbrayfield.php-docblocker",
      "felixfbecker.php-pack",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "windows") {
        return {
          name: "XAMPP (PHP + Apache + MySQL for Windows)",
          version: "latest",
          url: "https://www.apachefriends.org/xampp-files/8.2.12/xampp-windows-x64-8.2.12-0-VS16-installer.exe",
          filename: "xampp-latest-setup.exe",
          note: "Install XAMPP then add C:\\xampp\\php to your PATH environment variable.",
        };
      }
      if (os === "mac") {
        return {
          name: "XAMPP (PHP + Apache + MySQL for macOS)",
          version: "latest",
          url: "https://www.apachefriends.org/xampp-files/8.2.12/xampp-osx-8.2.12-0-installer.dmg",
          filename: "xampp-latest-setup.dmg",
          note: "Install XAMPP — verify with: /Applications/XAMPP/bin/php --version",
        };
      }
      return null;
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y php php-cli php-common php-mbstring php-curl",
    ],
    extraNote: "Verify install: open terminal and run: php --version",
  },

  {
    id: "kotlin",
    name: "Kotlin",
    icon: `${D}/kotlin/kotlin-original.svg`,
    description: "Kotlin with latest Oracle JDK — Android & backend dev",
    vsExtensions: ["fwcd.kotlin", "vscjava.vscode-java-pack"],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      const jdk = await resolveOracleJDK(os);
      return {
        ...jdk,
        name: `Oracle JDK ${jdk.version} LTS (required for Kotlin)`,
        note:
          jdk.note +
          " Then download Kotlin from: kotlinlang.org/docs/command-line.html",
      };
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y openjdk-21-jdk",
      "sudo snap install --classic kotlin",
    ],
    extraNote:
      "Kotlin requires JDK. For Android apps, Android Studio is recommended.",
  },

  {
    id: "swift",
    name: "Swift",
    icon: `${D}/swift/swift-original.svg`,
    description: "Latest Swift for iOS, macOS & server-side dev",
    vsExtensions: [
      "sswg.swift-lang",
      "vknabel.vscode-swift-development-environment",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveSwift(os);
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y clang libicu-dev binutils git",
    ],
    extraNote:
      "On macOS, install Xcode from the App Store for the best Swift experience.",
  },

  {
    id: "ruby",
    name: "Ruby",
    icon: `${D}/ruby/ruby-original.svg`,
    description: "Latest Ruby with DevKit — Rails support included",
    vsExtensions: [
      "shopify.ruby-lsp",
      "wingrunr21.vscode-ruby",
      "kaiwood.endwise",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      if (os === "windows") {
        return resolveRuby();
      }
      return {
        name: "Ruby via rbenv (macOS)",
        version: "latest",
        url: "https://brew.sh",
        filename: "ruby-mac.txt",
        note: "Run: brew install rbenv ruby-build && rbenv install 3.3.0 && rbenv global 3.3.0",
      };
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y ruby-full",
      "gem install bundler",
    ],
    extraNote: "Verify: ruby --version   Install Rails with: gem install rails",
  },

  {
    id: "rust",
    name: "Rust",
    icon: `${D}/rust/rust-original.svg`,
    description: "Latest Rust via rustup — rust-analyzer & Cargo",
    vsExtensions: [
      "rust-lang.rust-analyzer",
      "serayuzgur.crates",
      "vadimcn.vscode-lldb",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveRust(os);
    },
    linuxCommands: [
      "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
    ],
  },

  {
    id: "go",
    name: "Go (Golang)",
    icon: `${D}/go/go-original-wordmark.svg`,
    description: "Latest stable Go with official tools & test runner",
    vsExtensions: ["golang.go"],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveGo(os);
    },
    linuxCommands: ["sudo apt-get update && sudo apt-get install -y golang-go"],
  },

  {
    id: "dart",
    name: "Dart / Flutter",
    icon: `${D}/flutter/flutter-original.svg`,
    description: "Latest Flutter stable SDK (includes Dart)",
    vsExtensions: ["dart-code.dart-code", "dart-code.flutter"],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveFlutter(os);
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y curl git unzip",
      "git clone https://github.com/flutter/flutter.git -b stable ~/flutter",
      "echo 'export PATH=$HOME/flutter/bin:$PATH' >> ~/.bashrc && source ~/.bashrc",
    ],
    extraNote:
      "Run 'flutter doctor' in terminal after install to verify everything.",
  },

  {
    id: "r",
    name: "R (Statistics)",
    icon: `${D}/r/r-original.svg`,
    description: "Latest R for data science, statistics & visualization",
    vsExtensions: [
      "reditorsupport.r",
      "rdebugger.r-debugger",
      "ms-toolsai.jupyter",
    ],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os === "linux") {
        return null;
      }
      return resolveR(os);
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y r-base r-base-dev",
    ],
    extraNote:
      "After install, run in R: install.packages('languageserver') for VS Code support.",
  },

  {
    id: "lua",
    name: "Lua",
    icon: `${D}/lua/lua-original.svg`,
    description: "Lua 5.4 — lightweight scripting & game modding",
    vsExtensions: ["sumneko.lua", "trixnz.vscode-lua"],
    resolveDownload: async (os): Promise<ResolvedDownload | null> => {
      if (os !== "windows") {
        return null;
      }
      return {
        name: "LuaForWindows 5.1.5",
        version: "5.1.5",
        url: "https://github.com/rjpcomputing/luaforwindows/releases/download/v5.1.5-52/LuaForWindows_v5.1.5-52.exe",
        filename: "lua-setup.exe",
        note: "Run installer — lua.exe is added to PATH automatically. Restart VS Code.",
      };
    },
    linuxCommands: [
      "sudo apt-get update && sudo apt-get install -y lua5.4 luarocks",
    ],
    extraNote:
      "Popular for Roblox, Love2D game dev and embedding in applications.",
  },
];

export function getLanguage(id: string): Language | undefined {
  return LANGUAGES.find((l) => l.id === id);
}
