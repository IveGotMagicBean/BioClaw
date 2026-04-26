# BioClaw V2 UI 升级指南

本次升级为 BioClaw 添加了一套全新的 Web UI（V2），同时保留原版界面不变。数据完全兼容，无需迁移。

---

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
- `.env` 文件不在 git 跟踪范围内，升级时不会被覆盖

---

## V2 UI 新功能

- 9 套主题切换（default / ocean / sakura / cream / mono-light / midnight / slate / forest / wine）
- Thread 侧栏管理多个对话
- Lab Trace drawer（实时查看 agent 推理过程、工具调用、IPC 通信）
- **流式输出**：回答一字一字显示，思考过程只在 Lab Trace 中显示，最终结果显示在聊天框
- 中英文一键切换
- 可拖拽调节面板大小
- 响应式布局（移动端适配）

---

## 全新安装

```bash
git clone git@github.com:IveGotMagicBean/BioClaw.git
cd BioClaw
npm install
cp .env.example .env       # 编辑填入 API key
./container/build.sh       # 第一次构建容器，30-60 分钟（需下载生物工具）
npm run web
```

启动后：
- 原版 UI：`http://localhost:3000/`
- V2 UI：`http://localhost:3000/v2`

---

## 已有用户升级（推荐方式）

> 适用于已经 clone 过原仓库 (`Runchuan-BU/BioClaw`) 的用户。**原目录直接升级**，不需要重新 clone，不需要重填 API key，数据自动保留。

### 第 1 步（建议）：备份当前容器镜像（双保险，方便回退）

```bash
docker tag bioclaw-agent:latest bioclaw-agent:backup
```

这步是为了之后想回退时能瞬间切回，不用重新 build。

### 第 2 步：在原 BioClaw 目录加我的 fork 当 remote

```bash
cd /原来的BioClaw目录
git remote add v2 git@github.com:IveGotMagicBean/BioClaw.git
```

> `origin` 仍然指向原仓库 `Runchuan-BU/BioClaw`，`v2` 是额外加的。两边可以共存。

### 第 3 步：拉取 V2 改动

```bash
git fetch v2
git merge v2/main
```

### 第 4 步：重建容器

因为 `container/agent-runner/src/index.ts` 改了（加了 SSE 流式支持），容器需要重建：

```bash
./container/build.sh
```

> **为什么很快？** Docker 分层缓存，基础镜像和 apt/pip 包不变，只重跑最后的 COPY 步骤，约 1-2 分钟完成。

### 第 5 步：重启服务

```bash
npm run stop:web
npm run web
```

### 完成

访问 `http://localhost:3000/v2` 使用新界面，原版 `http://localhost:3000/` 不变。

---

## 不喜欢想回退到原版？

V2 改动是可逆的，回退很简单。**数据不会丢**（store/ 和 groups/ 不会被动）。

### 方式 A：有备份镜像（推荐，瞬间完成）

如果升级前做了 Step 1 的备份：

```bash
git reset --hard origin/main                          # 代码回退
docker tag bioclaw-agent:backup bioclaw-agent:latest  # 镜像换回备份
npm run stop:web && npm run web                       # 重启
```

不需要重新 build 容器，瞬间回退到原版。

### 方式 B：没备份镜像（需要重 build）

```bash
git reset --hard origin/main
./container/build.sh           # 用回原版代码重建容器，1-2 分钟
npm run stop:web && npm run web
```

> **为什么代码回退还要重建容器？** 因为 V2 改了容器内的 agent-runner 代码（加了流式输出）。如果只回退宿主机代码不重建容器，宿主机不会过滤 streaming chunks，但容器一直在发，会导致聊天框收到很多不完整的消息。所以代码和容器必须一起回退。

---

## 关于 Docker 和 npm 的关系

简单来说：

- `npm run web` 启动的是**宿主机上**的 Node 调度程序
- 每次有人聊天，调度程序**用 Docker 启动一个临时容器**来跑 agent
- 容器从 `bioclaw-agent:latest` 镜像克隆出来，干完活就关掉

所以："重启" 分三种：

| 改了什么 | 要做什么 |
|---|---|
| 前端文件（HTML/CSS/JS） | 浏览器刷新 |
| 宿主机代码（`src/`） | 重启 npm（`npm run stop:web && npm run web`） |
| 容器内代码（`container/`） | 重建镜像（`./container/build.sh`） |
| Docker Desktop 本身 | **不用动**，正常开着即可 |

V2 升级改了第 2、3 项，所以要重建镜像 + 重启 npm。Docker Desktop 不用碰。

---

## 数据为什么是共享的？

V2 和原版 UI **不是两套独立程序**，只是**同一个后端的两套前端**：

```
http://localhost:3000/      → 原版 HTML/JS/CSS
http://localhost:3000/v2    → V2 HTML/JS/CSS
                            ↓
                     同一个 Node 服务
                            ↓
                  同一个 store/messages.db
                  同一个 groups/ 目录
```

两个页面用的都是 `/api/messages`、`/api/threads`、`/api/trace/list` 等同一套 API。所以原版发的消息、V2 也能看到，反之亦然。

---

## 安装位置无关

BioClaw 的 Docker 挂载是**动态的**——根据 `process.cwd()` 算路径：

```ts
const PROJECT_ROOT = process.cwd();
export const GROUPS_DIR = path.resolve(PROJECT_ROOT, 'groups');
export const STORE_DIR = path.resolve(PROJECT_ROOT, 'store');
```

无论装在哪里（`~/code/BioClaw`、`D:\projects\BioClaw`、`/opt/BioClaw`），只要进入目录后 `npm run web`，挂载路径都会自动算对。**不需要任何额外配置。**
