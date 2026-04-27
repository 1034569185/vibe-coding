# vibe-coding

一个最小可用的 MIDI 文件上传页面示例，支持在浏览器中选择 `.mid/.midi` 文件并立即显示处理结果，避免“点击上传后没反应”的体验。

## 目录说明

- `/home/runner/work/vibe-coding/vibe-coding/index.html`：主页面（包含样式与脚本）

## 快速开始（推荐）

> 不要直接双击打开 `index.html`（`file://`），请通过本地 HTTP 服务访问。

### 方式 1：Python（最简单）

```bash
cd /home/runner/work/vibe-coding/vibe-coding
python3 -m http.server 5500
```

然后访问：

`http://localhost:5500/index.html`

### 方式 2：Node.js（可选）

```bash
npx serve /home/runner/work/vibe-coding/vibe-coding -l 5500
```

然后访问：

`http://localhost:5500/index.html`

## 使用方法

1. 打开页面后，点击“选择 MIDI 文件”。
2. 选择一个 `.mid` 或 `.midi` 文件。
3. 页面会显示：
   - 文件名
   - 文件大小
   - MIDI 头信息（`MThd`）
   - 格式（Format）
   - 轨道数（Tracks）
   - 分辨率（Division / TPQN）
4. 点击“清空”可重置当前状态。

## 常见问题排查

### 1) 打开 `http://localhost:5500` 没反应

请按顺序检查：

- 终端里启动服务后是否有 `Serving HTTP on ...` 提示
- 地址是否写成了 `http://localhost:5500/index.html`
- 5500 端口是否被占用（可换成 8000 再试）
- 是否在正确目录启动服务：
  `/home/runner/work/vibe-coding/vibe-coding`

### 2) 选择文件后“没反应”

页面已加入可见状态提示，请检查是否出现以下信息：

- `读取中...`
- `✅ 文件已读取并通过基础校验`
- 或错误信息（如文件类型不对、头信息不是 `MThd`、文件损坏等）

如果仍异常，请打开浏览器开发者工具（F12）查看 Console 报错。

### 3) 为什么不能直接双击 `index.html`？

直接用 `file://` 打开时，不同浏览器会对脚本与资源访问有不同限制。通过 `http://localhost` 访问更稳定，也更接近真实部署环境。
