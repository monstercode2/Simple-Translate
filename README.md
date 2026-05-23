# 简单翻译 / Simple Translate

简单翻译是一个轻量级浏览器翻译扩展，专注于网页段落双语翻译和划词翻译。它支持 OpenAI-compatible API，也支持通过 Ollama 调用本地模型，适合希望自己掌控模型、API Key 和数据流向的用户。

## 功能

- 网页段落双语翻译
- 页面右侧粉色悬浮翻译球，一键翻译或移除译文
- 划词翻译浮窗
- 支持 OpenAI-compatible `/v1/chat/completions` 接口
- 支持 Ollama 本地模型，默认地址为 `http://localhost:11434`
- 支持批量翻译和后台内存缓存
- 可在设置页配置翻译服务、模型、目标语言、源语言和批量大小
- 粉色气泡风格扩展图标

## 从源码安装

1. 克隆或下载这个仓库。
2. 打开 `chrome://extensions` 或 `edge://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择项目目录，例如 `D:\local-immersive-translate`。
6. 打开扩展的设置页，配置翻译服务。

## Ollama 本地模型配置

先安装并启动 Ollama，然后拉取一个模型：

```powershell
ollama pull qwen2.5:7b
ollama serve
```

设置页推荐填写：

- 翻译服务：`Ollama 本地模型`
- 服务地址：`http://localhost:11434`
- 模型名称：`qwen2.5:7b`

也可以换成其他 Ollama 已安装模型，只要该模型可以通过 Ollama 的 `/api/chat` 接口调用。

## OpenAI-compatible API 配置

设置页推荐填写：

- 翻译服务：`OpenAI-compatible API`
- 接口地址：`https://api.openai.com/v1`
- API Key：你的 API Key
- 模型名称：`gpt-4.1-mini` 或其他支持 Chat Completions 的模型

如果使用其他兼容服务，填写对应服务商的 `/v1` 地址和模型名称即可。

## 使用方式

- 点击网页右侧粉色悬浮翻译球，翻译或移除当前页面译文。
- 点击扩展图标，再点击“翻译页面”。
- 使用快捷键 `Alt+T` 切换页面翻译。
- 在网页中选中文字，会出现划词翻译浮窗。
- 在设置页选择 Ollama 或 OpenAI-compatible API，并按页面提示填写地址、模型和语言。

## 隐私说明

简单翻译不会内置中转服务器。翻译内容会直接发送到你配置的翻译服务：

- 使用 Ollama 时，请求发送到你的本地 Ollama 服务。
- 使用 OpenAI-compatible API 时，请求发送到你配置的 API endpoint。

API Key 保存在浏览器扩展存储中，不会写入项目文件，也不会提交到 GitHub。当前缓存是后台 Service Worker 的内存缓存，浏览器重启或 Service Worker 被回收后会失效。

## 图标

扩展图标文件位于 `icons/`：

- `icons/icon-16.png`
- `icons/icon-32.png`
- `icons/icon-48.png`
- `icons/icon-128.png`
- `icons/icon-source.png`

## 当前限制

- 暂未实现 PDF、字幕、OCR 和术语表。
- 页面翻译目前最多处理前 160 个文本块。
- 缓存仅保存在内存中，Service Worker 重启后会失效。
- 暂未提供持久化请求日志面板。

## 路线图

- 持久化本地翻译缓存
- 可选的请求日志和错误日志面板
- 站点级自动翻译规则
- 更好的 SPA 动态页面支持
- 自定义翻译提示词和术语表
- Firefox 兼容性适配

## License

暂未选择开源许可证。正式发布前建议添加 `LICENSE` 文件，明确他人是否可以复用、修改和分发代码。
