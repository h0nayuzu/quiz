# Web 访问功能使用指南

## 概述

Quiz App 现在支持通过 Web 浏览器访问，允许您在手机、平板或其他设备上使用应用。

## 快速开始

### 开发模式

1. 启动应用：
```bash
cd electron-quiz-app
npm run dev
```

2. Web服务器会自动在端口 3000 启动

3. 在浏览器中访问：
   - 桌面版：`http://localhost:3000`
   - 手机版：`http://localhost:3000/mobile`（移动端优化UI）

4. 在同一局域网内的其他设备访问：
   - 查找您的本机IP地址（例如：`192.168.1.100`）
   - 在手机浏览器访问：`http://192.168.1.100:3000/mobile`

### 生产模式

1. 构建应用：
```bash
npm run build
```

2. 启动打包后的应用，Web服务器会自动启动

3. 访问方式与开发模式相同

## 功能特性

### ✅ 已支持的功能

- 📊 查看统计数据（通过 API）
- 📝 获取所有题目
- 🎲 获取随机题目
- 🔍 搜索题目
- ⚙️ 获取和更新设置
- 🤖 AI 答案分析
- 🤖 AI 题目解释

### 🚧 开发模式限制

在开发模式下，由于 Vite 开发服务器的特性，完整的 UI 界面可能无法正常显示。但所有 API 端点都可以正常使用。

要体验完整的 Web UI，请使用生产模式或创建独立的 Web 构建。

## API 端点

所有 API 端点都返回 JSON 格式的数据。

### 健康检查
```
GET /health
```

响应示例：
```json
{
  "status": "ok",
  "mode": "development"
}
```

### 题目相关

#### 获取所有题目
```
GET /api/database/questions/all
```

#### 获取随机题目
```
GET /api/database/questions/random/:count
```

参数：
- `count`: 题目数量

#### 搜索题目
```
POST /api/database/questions/search
Content-Type: application/json

{
  "keyword": "搜索关键词"
}
```

### 统计相关

#### 获取统计信息
```
GET /api/database/stats
```

#### 更新题目统计
```
POST /api/database/stats/update
Content-Type: application/json

{
  "questionId": 1,
  "correct": true
}
```

### 设置相关

#### 获取设置
```
GET /api/settings
```

#### 更新设置
```
POST /api/settings
Content-Type: application/json

{
  "theme": "dark",
  "language": "zh-CN"
}
```

### AI 相关

#### 分析答案
```
POST /api/ai/analyze
Content-Type: application/json

{
  "question": "题目内容",
  "userAnswer": "用户答案"
}
```

#### 解释题目
```
POST /api/ai/explain
Content-Type: application/json

{
  "question": "题目内容"
}
```

## 移动端优化

访问 `/mobile` 路径可以获得针对手机优化的UI界面：

- 响应式布局
- 触摸友好的按钮尺寸
- 针对小屏幕优化的导航
- 移动端手势支持

## 安全注意事项

⚠️ **重要提醒**

- Web 服务器默认在本地网络运行，无需身份验证
- 请勿在公共网络上暴露此服务
- 如需在公网访问，建议：
  1. 添加身份验证中间件
  2. 使用 HTTPS
  3. 配置防火墙规则
  4. 限制访问IP范围

## 自定义配置

### 更改端口

在 `src/main/index.ts` 中修改：

```typescript
startWebServer(3000) // 更改为您想要的端口
```

### 添加自定义路由

在 `src/main/services/webServer.ts` 中添加新的路由：

```typescript
app.get('/api/custom', async (req, res) => {
  // 您的逻辑
  res.json({ data: 'custom response' })
})
```

## 故障排除

### 问题：无法访问 Web 服务器

解决方案：
1. 检查防火墙设置，确保端口 3000 未被阻止
2. 验证应用是否正常启动
3. 检查终端输出中的 "Web server started" 消息

### 问题：手机无法访问

解决方案：
1. 确保手机和电脑在同一局域网内
2. 使用电脑的实际 IP 地址，而非 localhost
3. 检查路由器是否启用了 AP 隔离

### 问题：API 返回错误

解决方案：
1. 查看终端输出中的错误信息
2. 确保数据库已正确初始化
3. 验证 API 请求格式是否正确

## 下一步改进

可能的增强功能：

- [ ] 添加用户认证
- [ ] 支持 HTTPS
- [ ] 添加 WebSocket 实时同步
- [ ] 创建独立的 Web 应用构建
- [ ] 支持离线模式（PWA）
- [ ] 添加 API 速率限制
- [ ] 实现数据缓存

## 技术栈

- **Web 服务器**: Express.js
- **API**: RESTful
- **前端**: React + Vite
- **数据库**: SQLite（通过 better-sqlite3）
- **跨域**: CORS

## 反馈与支持

如遇到问题或有改进建议，请提交 Issue 或 Pull Request。
