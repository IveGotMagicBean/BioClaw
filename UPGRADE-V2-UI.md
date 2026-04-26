# BioClaw V2 UI 升级指南

本次升级为 BioClaw 添加了一套全新的 Web UI（V2），同时保留原版界面不变。数据完全兼容，无需迁移。

## 改动总览

### 新增文件

| 文件/目录 | 说明 |
|-----------|------|
| `src/channels/local-web/assets/v2/index.html` | V2 页面结构（drawer 布局、多主题、thread 侧栏） |
| `src/channels/local-web/assets/v2/style.css` | V2 样式（9 套主题、响应式布局、暗色模式） |
| `src/channels/local-web/assets/v2/app.js` | V2 前端逻辑（lab trace drawer、streaming bubble、i18n） |

### 修改文件

| 文件 | 改动 | 说明 |
|------|------|------|
| `src/channels/local-web/channel.ts` | +5 行 | 添加 `/v2` 路由，将请求指向 `assets/v2/index.html` |
| `container/agent-runner/src/index.ts` | ~160 行 | OpenAI 兼容接口支持 SSE 流式输出；thinking/tool_use 步骤通过 IPC 发送到 trace |
| `src/index.ts` | +8 行 | 跳过 streaming chunks 不推送到聊天；trace preview 长度从 800→8000 字符 |
| `src/container-runner.ts` | +1 行 | `ContainerOutput.status` 新增 `'streaming'` 类型 |

### 不受影响的内容

- 原版 UI（`http://localhost:3000/`）完全不变
- **所有聊天记录、会话数据、群组配置不受影响**（数据存储在宿主机的 `store/` 和 `groups/` 目录，不在容器内，重建容器也不会丢失）
- WhatsApp / 微信 / 飞书等其他 channel 不受影响
- 原有 API 接口不变

---

## 已有用户升级方法

> 适用于已经 clone 过 BioClaw 仓库的用户。只需下载新文件 + 改几行代码，**不影响原有数据和功能**。

### 方法一：重新拉取（推荐）

如果你的仓库指向本 fork：

```bash
git pull origin main
```

pull 后需要重新构建容器以启用流式输出功能：

```bash
./container/build.sh
```

然后重启服务：

```bash
# 如果正在运行，先停止
npm run stop:web

# 重新启动
npm run web
```

> **重启/重建容器会丢数据吗？** 不会。所有聊天记录和配置存储在宿主机的 `store/` 和 `groups/` 目录中，不在容器内。重建容器、重启服务都不影响历史数据。

完成。访问 `http://localhost:3000/v2` 即可使用新界面，原版 `http://localhost:3000/` 不变。

### 方法二：手动添加（适用于不想 pull 全部更新的用户）

#### 第 1 步：下载 V2 前端文件

将以下 3 个文件放到 `src/channels/local-web/assets/v2/` 目录下：

```bash
mkdir -p src/channels/local-web/assets/v2
```

从 GitHub 下载：

```bash
cd src/channels/local-web/assets
mkdir -p v2
curl -L "https://raw.githubusercontent.com/<你的用户名>/BioClaw/main/src/channels/local-web/assets/v2/index.html" -o v2/index.html
curl -L "https://raw.githubusercontent.com/<你的用户名>/BioClaw/main/src/channels/local-web/assets/v2/style.css" -o v2/style.css
curl -L "https://raw.githubusercontent.com/<你的用户名>/BioClaw/main/src/channels/local-web/assets/v2/app.js" -o v2/app.js
```

#### 第 2 步：添加 /v2 路由

打开 `src/channels/local-web/channel.ts`，找到以下代码：

```typescript
if (req.method === 'GET' && url.pathname === '/') {
  this.serveStaticAsset('/assets/index.html', res);
  return;
}
```

在它**下方**添加：

```typescript
if (req.method === 'GET' && url.pathname === '/v2') {
  this.serveStaticAsset('/assets/v2/index.html', res);
  return;
}
```

#### 第 3 步：重启服务

```bash
npm run stop:web
npm run web
```

访问 `http://localhost:3000/v2` 即可。这两步完成后新 UI 就能用了，原版不受影响。

#### 第 4 步（可选）：启用流式输出和 Lab Trace

> 上面三步就能使用新 UI 的外观和基本功能。如果还想启用 **Lab Trace 实时追踪** 和 **流式输出预览**，需要额外修改以下文件。

**4a. `src/container-runner.ts`**

找到 `ContainerOutput` 接口定义：

```typescript
export interface ContainerOutput {
  status: 'success' | 'error';
```

改为：

```typescript
export interface ContainerOutput {
  status: 'success' | 'error' | 'streaming';
```

**4b. `src/index.ts`**

找到 `runAgent` 的 `onOutput` 回调（在 `processAgentMessages` 函数中）：

```typescript
const output = await runAgent(group, agentId, agentPrompt, replyChatJid, async (result) => {
    if (result.result) {
```

在 `if (result.result)` **之前**添加：

```typescript
    // Streaming chunks only feed the trace/SSE preview — don't push partial
    // messages to the chat. Wait for the final success chunk.
    if (result.status === 'streaming') {
      resetIdleTimer();
      return;
    }
```

**4c. `container/agent-runner/src/index.ts`**

这个改动较大（~160 行），主要是让 OpenAI 兼容接口支持 SSE 流式输出。建议直接从仓库下载替换：

```bash
curl -L "https://raw.githubusercontent.com/<你的用户名>/BioClaw/main/container/agent-runner/src/index.ts" -o container/agent-runner/src/index.ts
```

替换后需要重新构建容器并重启：

```bash
./container/build.sh
npm run stop:web
npm run web
```

---

## 使用方式

启动服务后：

- **原版 UI**：`http://localhost:3000/`
- **V2 UI**：`http://localhost:3000/v2`

两个界面共享同一份数据，可以随时切换。

## V2 UI 新功能

- 9 套主题切换（default / ocean / sakura / cream / mono-light / midnight / slate / forest / wine）
- Thread 侧栏管理多个对话
- Lab Trace drawer（查看 agent 推理过程、工具调用）
- 流式输出预览（thinking 过程只在 Lab Trace 中显示，最终结果显示在聊天框）
- 中英文切换
- 可调节面板大小
- 响应式布局（移动端适配）
