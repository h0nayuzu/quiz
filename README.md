<div align="center">

# 🎓 Electron Quiz App

<p align="center">
  <strong>一个功能强大的跨平台智能题库应用</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Node-%3E%3D18-brightgreen?style=flat-square" alt="Node Version" />
</p>

<p align="center">
  支持 AI 辅助答题 • 模拟考试 • 错题复习 • 移动端访问
</p>

---

</div>

## 📑 目录

- [✨ 功能特性](#-功能特性)
- [🛠️ 技术栈](#️-技术栈)
- [📦 快速开始](#-快速开始)
- [📱 使用指南](#-使用指南)
- [🏗️ 项目结构](#️-项目结构)
- [⚙️ 配置说明](#️-配置说明)
- [👨‍💻 开发指南](#-开发指南)
- [📄 许可证](#-许可证)

---

## ✨ 功能特性

<table>
<tr>
<td width="50%">

### 📚 核心功能

- 🗂️ **题库管理**
  - Excel 文件一键导入
  - 自动解析题目、选项和答案
  - 支持批量管理

- 🤖 **AI 智能辅助**
  - 多种 AI 服务集成
  - 智能答题建议
  - 知识点解析

- 📝 **模拟考试**
  - 随机抽题组卷
  - 实时计时
  - 自动评分统计

</td>
<td width="50%">

### 🎯 进阶功能

- 🔍 **智能搜索**
  - 全文搜索题目
  - 多条件筛选
  - 快速定位

- 📊 **错题管理**
  - 自动记录错题
  - 针对性复习
  - 学习进度追踪

- 📱 **移动端支持**
  - 内置 Web 服务器
  - 局域网访问
  - 响应式设计

</td>
</tr>
</table>

---

## 🛠️ 技术栈

<div align="center">

| 类别 | 技术 |
|:---:|:---|
| 🖥️ **桌面框架** | Electron + Electron Vite |
| ⚛️ **前端框架** | React 18 + TypeScript |
| 🎨 **UI 框架** | Radix UI + Tailwind CSS |
| 🗄️ **数据存储** | Better-SQLite3 |
| 🔀 **路由管理** | Electron Router DOM |
| 📊 **数据处理** | XLSX (Excel 解析) |
| 🤖 **AI 集成** | OpenAI SDK (多服务兼容) |
| 🌐 **Web 服务** | Express.js |

</div>

---

## 📦 快速开始

### 📋 环境要求

```bash
Node.js >= 18
npm 或 pnpm
```

### 🚀 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

### 💻 开发模式

```bash
npm run dev
```

应用将以开发模式启动，支持热重载。

### 📦 构建应用

```bash
# 构建当前平台
npm run build

# 构建所有平台 (需要在对应平台上执行)
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

构建完成后，安装包将生成在 `dist` 目录中。

---

## 📱 使用指南

### 1️⃣ 导入题库

<table>
<tr>
<td width="30%"><strong>步骤</strong></td>
<td width="70%"><strong>说明</strong></td>
</tr>
<tr>
<td>选择文件</td>
<td>在设置页面点击"选择题库文件"按钮</td>
</tr>
<tr>
<td>文件格式</td>
<td>支持 <code>.xlsx</code> 格式的 Excel 文件</td>
</tr>
<tr>
<td>自动解析</td>
<td>应用会自动解析题目、选项、答案和解析</td>
</tr>
</table>

### 2️⃣ 配置 AI 服务（可选）

支持以下 AI 服务提供商：

| 服务商 | 类型 | 说明 |
|:---:|:---:|:---|
| 🟢 **OpenAI** | 云服务 | GPT-3.5/4 系列模型 |
| 🔵 **Ollama** | 本地 | 本地运行的开源模型 |
| 🟡 **通义千问** | 云服务 | 阿里云 AI 服务 |
| 🟣 **DeepSeek** | 云服务 | DeepSeek AI 服务 |
| ⚪ **自定义** | 兼容 | 任何兼容 OpenAI API 的服务 |

**配置步骤：**
1. 进入设置页面
2. 选择服务类型
3. 输入 API Key
4. 配置 Base URL（可选）
5. 选择模型名称

### 3️⃣ 开始使用

```
🏠 首页
 ├─ 📝 开始答题      → 进入练习模式
 ├─ 🎯 模拟考试      → 计时考试模式
 ├─ 🔍 搜索题目      → 查找特定题目
 └─ 📊 错题复习      → 复习错题集
```

### 4️⃣ 移动端访问

1. 启动桌面应用
2. 查看设置页面显示的访问地址
3. 在同一局域网的移动设备浏览器中输入地址
4. 开始使用移动端界面

> 💡 **提示**: 确保设备连接在同一 Wi-Fi 网络下

---

## 🏗️ 项目结构

```
electron-quiz-app/
├── 📁 src/
│   ├── 🖥️ main/                  # 主进程代码
│   │   ├── index.ts              # 入口文件
│   │   ├── 📂 services/          # 服务层
│   │   │   ├── aiService.ts      # 🤖 AI 服务
│   │   │   ├── databaseService.ts # 🗄️ 数据库服务
│   │   │   ├── excelService.ts   # 📊 Excel 导入
│   │   │   ├── settingsService.ts # ⚙️ 设置管理
│   │   │   └── webServer.ts      # 🌐 Web 服务器
│   │   └── 📂 windows/           # 窗口管理
│   │
│   ├── 🔌 preload/               # 预加载脚本
│   │   └── index.ts              # IPC 桥接
│   │
│   ├── 🎨 renderer/              # 渲染进程 (React)
│   │   ├── 📂 screens/           # 页面组件
│   │   │   ├── HomePage.tsx      # 🏠 首页
│   │   │   ├── QuizPage.tsx      # 📝 答题页
│   │   │   ├── MockExamPage.tsx  # 🎯 模拟考试
│   │   │   ├── SearchPage.tsx    # 🔍 搜索页
│   │   │   ├── ResultPage.tsx    # 📊 结果页
│   │   │   └── SettingsPage.tsx  # ⚙️ 设置页
│   │   ├── 📂 components/        # UI 组件
│   │   │   ├── Layout.tsx        # 布局组件
│   │   │   └── ui/               # Radix UI 组件
│   │   └── 📂 contexts/          # React Context
│   │
│   ├── 🔗 shared/                # 共享代码
│   │   ├── types.ts              # 类型定义
│   │   ├── constants.ts          # 常量
│   │   └── utils.ts              # 工具函数
│   │
│   └── 📦 resources/             # 资源文件
│       ├── build/icons/          # 应用图标
│       └── public/               # 公共资源
│
├── 📄 package.json               # 项目配置
├── 📄 electron.vite.config.ts    # Vite 配置
├── 📄 tsconfig.json              # TypeScript 配置
└── 📄 README.md                  # 项目文档
```

---

## ⚙️ 配置说明

### 📂 数据存储位置

| 类型 | 路径 | 说明 |
|:---|:---|:---|
| 🗄️ 数据库 | `userData/quiz.db` | SQLite 数据库文件 |
| ⚙️ 配置 | `userData/settings.json` | 应用配置文件 |
| 📊 日志 | `userData/logs/` | 应用日志文件 |

> 💡 `userData` 路径根据操作系统不同而不同：
> - Windows: `%APPDATA%/electron-quiz-app`
> - macOS: `~/Library/Application Support/electron-quiz-app`
> - Linux: `~/.config/electron-quiz-app`

### 🤖 AI 服务配置示例

#### OpenAI 配置
```json
{
  "aiProvider": "openai",
  "apiKey": "sk-...",
  "apiUrl": "https://api.openai.com/v1",
  "model": "gpt-3.5-turbo"
}
```

#### Ollama 本地配置
```json
{
  "aiProvider": "ollama",
  "apiKey": "ollama",
  "apiUrl": "http://localhost:11434/v1",
  "model": "llama2"
}
```

#### 通义千问配置
```json
{
  "aiProvider": "qwen",
  "apiKey": "sk-...",
  "apiUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "model": "qwen-turbo"
}
```

---

## 👨‍💻 开发指南

### 🔧 添加新页面

1. **创建页面组件**
   ```bash
   src/renderer/screens/NewPage.tsx
   ```

2. **添加路由**
   ```typescript
   // src/renderer/routes.tsx
   <Route path="/new" element={<NewPage />} />
   ```

3. **添加导航入口**
   ```typescript
   // src/renderer/components/Layout.tsx
   <Link to="/new">新页面</Link>
   ```

### 📡 添加 IPC 通信

1. **定义类型** (`src/preload/index.ts`)
   ```typescript
   newMethod: (arg: string) => Promise<Result>
   ```

2. **注册处理** (`src/main/index.ts`)
   ```typescript
   ipcMain.handle('new-method', async (_, arg) => {
     return await handleNewMethod(arg)
   })
   ```

3. **调用方法** (渲染进程)
   ```typescript
   const result = await window.api.newMethod(arg)
   ```

### 🗄️ 数据库迁移

数据库表结构定义在：
```
src/main/services/databaseService.ts
└── initDatabase() 方法
```

添加新表或修改表结构时，需要处理现有数据的迁移逻辑。

### 🎨 添加新主题

1. 在 `src/renderer/globals.css` 中定义颜色变量
2. 在 `ThemeContext.tsx` 中添加主题切换逻辑
3. 使用 Tailwind CSS 类名应用主题

---

## 📄 许可证

<div align="center">

**MIT License**

Copyright (c) 2024

本项目采用 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。

</div>

---

## 🤝 贡献

<div align="center">

欢迎贡献代码、报告问题或提出建议！

[![GitHub Issues](https://img.shields.io/github/issues/yourusername/electron-quiz-app?style=flat-square)](https://github.com/yourusername/electron-quiz-app/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/yourusername/electron-quiz-app?style=flat-square)](https://github.com/yourusername/electron-quiz-app/pulls)

### 贡献步骤

1. 🍴 Fork 本仓库
2. 🔀 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 💾 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 📤 推送到分支 (`git push origin feature/AmazingFeature`)
5. 🎉 创建 Pull Request

</div>

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ by [Your Name]

</div>
