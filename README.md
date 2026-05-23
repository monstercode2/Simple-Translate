# 简单翻译 / Simple Translate

简单翻译是一个轻量级浏览器翻译扩展，专注于网页双语翻译和划词翻译。它支持 OpenAI-compatible API，也支持通过 Ollama 调用本地模型，适合希望自己掌控模型、API Key 和数据流向的用户。

## Features

- 网页段落双语翻译
- 页面悬浮翻译球，一键翻译或移除译文
- 划词翻译浮窗
- OpenAI-compatible `/v1/chat/completions` 接口
- Ollama 本地模型，默认地址为 `http://localhost:11434`
- 批量翻译、简单重试边界和后台内存缓存
- 本地配置 provider、模型、目标语言和批量大小
- 粉色气泡风格扩展图标

## Install From Source

1. Clone this repository.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode.
4. Click "Load unpacked".
5. Select the project folder, for example `D:\local-immersive-translate`.
6. Open the extension options and configure a translation provider.

## Ollama Setup

Install and run Ollama, then pull a model:

```powershell
ollama pull qwen2.5:7b
ollama serve
```

Recommended options:

- Provider: `Ollama local model`
- Base URL: `http://localhost:11434`
- Model: `qwen2.5:7b`

Other local models can be used as long as they work with Ollama's `/api/chat` endpoint.

## OpenAI-compatible Setup

Recommended options:

- Provider: `OpenAI-compatible API`
- Base URL: `https://api.openai.com/v1`
- API key: your API key
- Model: `gpt-4.1-mini` or another chat completions model

For other compatible providers, set their `/v1` base URL and model name.

## Usage

- Click the pink floating translation ball on the right side of the page.
- Click the extension icon, then click "Translate page".
- Use `Alt+T` to toggle page translation.
- Select text on a page to show the translation popover.
- Open the options page to choose Ollama or an OpenAI-compatible API. The options page includes setup hints for provider URL, model name, target language, and API key storage.

## Privacy

简单翻译不会内置中转服务器。翻译内容会直接发送到你配置的 provider：

- 使用 Ollama 时，请求发送到你的本地 Ollama 服务。
- 使用 OpenAI-compatible API 时，请求发送到你配置的 API endpoint。

当前缓存是后台 Service Worker 的内存缓存，浏览器重启或 Service Worker 回收后会失效。

## Icons

The extension icon files are stored in `icons/`:

- `icons/icon-16.png`
- `icons/icon-32.png`
- `icons/icon-48.png`
- `icons/icon-128.png`
- `icons/icon-source.png`

## Current Limitations

- PDF, subtitles, OCR, and glossary features are not implemented.
- Page translation currently caps at the first 160 text blocks.
- Cache is memory-only and resets when the Service Worker restarts.
- There is no persistent request log yet.

## Roadmap

- Persistent local translation cache
- Optional request/error log panel
- Site-level auto-translate rules
- Better dynamic page support for SPA feeds
- Custom prompt and glossary support
- Firefox compatibility pass

## License

License has not been selected yet. Add a `LICENSE` file before publishing if you want others to reuse, modify, or distribute the code clearly.
