<div align="center">
<img src="bioclaw_logo.jpg" width="200">

# BioClaw

### 在聊天里跑生物信息学分析的 AI 助手

[English](README.md) | [简体中文](README.zh-CN.md)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Runchuan-BU/BioClaw)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/Runchuan-BU/BioClaw/blob/main/LICENSE)
[![Paper](https://img.shields.io/badge/bioRxiv-STELLA-b31b1b.svg)](https://www.biorxiv.org/content/10.1101/2025.07.01.662467v2)
[![arXiv](https://img.shields.io/badge/arXiv-2507.02004-b31b1b.svg)](https://arxiv.org/abs/2507.02004)

</div>

---

## 目录

- [概览](#概览)
- [快速开始](#快速开始)
- [消息通道](#消息通道)
- [示例演示](#示例演示)
- [系统架构](#系统架构)
- [内置工具](#内置工具)
- [项目结构](#项目结构)
- [引用](#引用)
- [许可证](#许可证)

## 概览

BioClaw 将常见的生物信息学任务带到聊天界面中。研究者可以通过自然语言完成：

- BLAST 序列检索
- 蛋白结构渲染（PyMOL）
- 测序数据质控（FastQC / MultiQC）
- 差异分析可视化（火山图等）
- 文献检索与摘要

默认通道为 WhatsApp；企业微信、Discord、本地网页等配置见 **[docs/CHANNELS.zh-CN.md](docs/CHANNELS.zh-CN.md)**。QQ / 飞书相关截图为路线图示意，详见该文档。

## 快速开始

### 环境要求

- macOS 或 Linux
- Node.js 20+
- Docker Desktop
- Anthropic API Key 或 OpenRouter API Key

### 安装

```bash
git clone https://github.com/Runchuan-BU/BioClaw.git
cd BioClaw
npm install
cp .env.example .env
# 编辑 .env，至少配置模型提供方密钥（见下文）

# 首次需要构建 Agent 镜像
docker build -t bioclaw-agent:latest container/

npm start   # WhatsApp：首次运行请在终端扫描二维码
```

### 模型提供方配置

BioClaw 现在支持两条模型路径：

- **Anthropic**：默认路径，保留原来的 Claude Agent SDK 工作流
- **OpenRouter / OpenAI-compatible**：可选路径，适合 OpenRouter 或其他兼容 `/chat/completions` 的服务

请在项目根目录创建 `.env`，然后选择以下其中一种配置。

**方案 A：Anthropic（默认）**

```bash
ANTHROPIC_API_KEY=your_anthropic_key
```

**方案 B：OpenRouter**（支持 Gemini、DeepSeek、Claude、GPT 等）

```bash
MODEL_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1
```

常用模型 ID：`deepseek/deepseek-chat-v3.1`、`google/gemini-2.5-flash`、`anthropic/claude-3.5-sonnet`。完整列表：[openrouter.ai/models](https://openrouter.ai/models)

**注意**：请选用支持 [tool calling](https://openrouter.ai/models?supported_parameters=tools) 的模型（如 DeepSeek、Gemini、Claude）。会话历史在单次容器运行期间保留；空闲超时后新容器会以全新上下文启动。

**通用 OpenAI-compatible 配置**

```bash
MODEL_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_API_KEY=your_api_key
OPENAI_COMPATIBLE_BASE_URL=https://your-provider.example/v1
OPENAI_COMPATIBLE_MODEL=your-model-name
```

修改 `.env` 后，重启 BioClaw：

```bash
npm run dev
```

容器启动后，可以通过 `docker logs <container-name>` 查看当前实际使用的是哪条 provider 路径。

### 使用

在已接入的群聊中发送：

```text
@Bioclaw <你的请求>
```

## 消息通道

各平台逐步配置、环境变量、本地网页与 **Windows（WSL2）** 说明见 **[docs/CHANNELS.zh-CN.md](docs/CHANNELS.zh-CN.md)**；其中 Windows 细节补充在 **[docs/WINDOWS.zh-CN.md](docs/WINDOWS.zh-CN.md)**。需要**本地浏览器（对话与实验追踪同一页）**时，在项目根目录执行 **`npm run web`** 即可（仍会读取 `.env`）。

英文版通道文档：[docs/CHANNELS.md](docs/CHANNELS.md)。

可选 **Lab trace 观测**（SSE 时间线、工作区树）：`.env` 中 `ENABLE_DASHBOARD=true`。与本地网页同时开启时与聊天**同一页**（`/`）；仅开观测面板时用独立 `DASHBOARD_PORT`。说明见 [docs/DASHBOARD.md](docs/DASHBOARD.md)。

### Second Quick Start

如果希望更“无脑”地引导安装，给 OpenClaw 发送：

```text
install https://github.com/Runchuan-BU/BioClaw
```

## 示例演示

QQ / 飞书路线图示意截图已移至 [docs/CHANNELS.zh-CN.md](docs/CHANNELS.zh-CN.md)。任务类演示见 [ExampleTask/ExampleTask.md](ExampleTask/ExampleTask.md)。

## 系统架构

BioClaw 基于 NanoClaw 的容器化架构，并融合 STELLA 的生物医学能力：

```
聊天平台 -> Node.js 编排器 -> SQLite 状态 -> Docker 容器 -> Agent + 生物工具
```

## 内置工具

### 命令行工具

- BLAST+
- SAMtools
- BEDTools
- BWA
- minimap2
- FastQC
- seqtk
- fastp
- MultiQC
- seqkit
- bcftools / tabix
- pigz
- sra-toolkit
- salmon / kallisto
- PyMOL

### Python 库

- BioPython
- pandas / NumPy / SciPy
- matplotlib / seaborn
- scikit-learn
- RDKit
- PyDESeq2
- scanpy
- pysam

## 项目结构

```text
BioClaw/
├── src/                   # Node.js 编排器
├── container/             # Agent 镜像与运行器
├── groups/                # 各群工作区与 CLAUDE.md
├── docs/
│   ├── CHANNELS.md        # 消息通道（英文）
│   ├── CHANNELS.zh-CN.md  # 消息通道（中文）
│   ├── WINDOWS.zh-CN.md   # Windows / 本地网页
│   └── images/            # 文档配图
├── ExampleTask/           # Demo 任务与截图
└── README.md / README.zh-CN.md
```

## 引用

如果你在研究中使用 BioClaw，请参考英文 README 中的 Citation 条目。

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE)。
