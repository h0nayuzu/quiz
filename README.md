# Electron Quiz App

一个基于 Electron 的智能题库应用，支持 AI 辅助答题、模拟考试和题目搜索功能。

## 功能特性

### 核心功能
- **题库管理**: 支持从 Excel 文件导入题库，自动解析题目、选项和答案
- **智能答题**: 集成 AI 辅助功能，帮助理解和解答题目
- **模拟考试**: 随机抽取题目进行模拟考试，支持计时和评分
- **题目搜索**: 快速搜索和过滤题目
- **错题复习**: 自动记录错题，支持针对性复习

### 技术特性
- **跨平台**: 基于 Electron，支持 Windows、macOS 和 Linux
- **现代 UI**: 使用 React + TypeScript 构建，支持深色/浅色主题切换
- **本地数据库**: 使用 SQLite 存储题目和用户数据
- **AI 集成**: 支持多种 AI 服务（OpenAI、Ollama、通义千问等）
- **Web 访问**: 内置 Web 服务器，支持移动端浏览器访问

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron + Electron Vite
- **UI 组件**: Radix UI + Tailwind CSS
- **数据库**: Better-SQLite3
- **路由**: Electron Router DOM
- **Excel 解析**: XLSX
- **AI 集成**: OpenAI SDK (兼容多种 API)

## 项目结构

```
electron-quiz-app/
├── src/
│   ├── main/              # 主进程代码
│   │   ├── index.ts       # 主进程入口
│   │   ├── services/      # 服务层
│   │   │   ├── aiService.ts       # AI 服务
│   │   │   ├── databaseService.ts # 数据库服务
│   │   │   ├── excelService.ts    # Excel 导入服务
│   │   │   ├── settingsService.ts # 设置管理服务
│   │   │   └── webServer.ts       # Web 服务器
│   │   └── windows/       # 窗口管理
│   ├── preload/           # 预加载脚本
│   ├── renderer/          # 渲染进程 (React 应用)
│   │   ├── screens/       # 页面组件
│   │   │   ├── HomePage.tsx      # 首页
│   │   │   ├── QuizPage.tsx      # 答题页面
│   │   │   ├── MockExamPage.tsx  # 模拟考试
│   │   │   ├── SearchPage.tsx    # 搜索页面
│   │   │   ├── ResultPage.tsx    # 结果页面
│   │   │   └── SettingsPage.tsx  # 设置页面
│   │   ├── components/    # UI 组件
│   │   └── contexts/      # React Context
│   ├── shared/            # 共享代码
│   └── resources/         # 资源文件
├── package.json
└── electron.vite.config.ts
```

## 快速开始

### 环境要求
- Node.js >= 18
- npm 或 pnpm

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
```

构建完成后，安装包将生成在 `dist` 目录中。

## 使用说明

### 1. 导入题库
- 在设置页面点击"选择题库文件"
- 选择 Excel 文件（支持 .xlsx 格式）
- 应用会自动解析并导入题目

### 2. 配置 AI 服务（可选）
- 在设置页面配置 AI 服务
- 支持的服务类型：
  - OpenAI
  - Ollama (本地)
  - 通义千问
  - DeepSeek
  - 其他兼容 OpenAI API 的服务

### 3. 开始答题
- 首页选择"开始答题"进入练习模式
- 选择"模拟考试"进行计时考试
- 使用"搜索题目"快速查找特定题目

### 4. 移动端访问
- 应用启动后会自动开启 Web 服务器
- 在同一局域网内，使用移动设备浏览器访问显示的地址即可

## 配置说明

### 数据存储位置
- 数据库文件: `userData/quiz.db`
- 配置文件: `userData/settings.json`

### AI 服务配置
在设置页面配置以下参数：
- **服务类型**: 选择 AI 服务提供商
- **API Key**: 服务商提供的密钥
- **Base URL**: API 端点地址（可选）
- **模型**: 使用的模型名称

## 开发指南

### 添加新页面
1. 在 `src/renderer/screens/` 创建新组件
2. 在 `src/renderer/routes.tsx` 添加路由
3. 在导航菜单中添加入口

### 添加新的 IPC 通信
1. 在 `src/preload/index.ts` 定义类型
2. 在 `src/main/index.ts` 注册处理程序
3. 在渲染进程中通过 `window.api` 调用

### 数据库迁移
数据库表结构定义在 `src/main/services/databaseService.ts` 的 `initDatabase()` 方法中。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
