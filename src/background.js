const DEFAULT_SETTINGS = {
  provider: "ollama",
  targetLang: "zh-CN",
  sourceLang: "auto",
  openaiBaseUrl: "https://api.openai.com/v1",
  openaiApiKey: "",
  openaiModel: "gpt-4.1-mini",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "qwen2.5:7b",
  batchSize: 6
};

const cache = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...compact(existing) });
  chrome.contextMenus.create({
    id: "translate-selection",
    title: "Translate selection",
    contexts: ["selection"]
  });
});

chrome.commands.onCommand.addListener(async command => {
  if (command !== "toggle-page-translation") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PAGE_TRANSLATION" });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate-selection" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "TRANSLATE_SELECTION_TEXT",
      text: info.selectionText || ""
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "TRANSLATE_TEXTS") {
    translateTexts(message.texts || [], message.options || {})
      .then(result => sendResponse({ ok: true, result }))
      .catch(error => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }

  if (message?.type === "GET_SETTINGS") {
    getSettings().then(settings => sendResponse({ ok: true, settings }));
    return true;
  }
});

async function translateTexts(texts, options) {
  const settings = { ...(await getSettings()), ...options };
  const normalized = texts.map(text => String(text || "").trim());
  const results = new Array(normalized.length);
  const missing = [];

  normalized.forEach((text, index) => {
    const key = cacheKey(settings, text);
    if (cache.has(key)) {
      results[index] = cache.get(key);
    } else if (text) {
      missing.push({ text, index, key });
    } else {
      results[index] = "";
    }
  });

  for (let i = 0; i < missing.length; i += settings.batchSize) {
    const chunk = missing.slice(i, i + settings.batchSize);
    const translated = settings.provider === "openai"
      ? await translateWithOpenAI(chunk.map(item => item.text), settings)
      : await translateWithOllama(chunk.map(item => item.text), settings);

    chunk.forEach((item, offset) => {
      const value = translated[offset] || "";
      cache.set(item.key, value);
      results[item.index] = value;
    });
  }

  return results;
}

async function getSettings() {
  const values = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...compact(values) };
}

function compact(input) {
  return Object.fromEntries(Object.entries(input || {}).filter(([, value]) => value !== undefined && value !== ""));
}

function cacheKey(settings, text) {
  return JSON.stringify([
    settings.provider,
    settings.provider === "openai" ? settings.openaiModel : settings.ollamaModel,
    settings.sourceLang,
    settings.targetLang,
    text
  ]);
}

function buildPrompt(texts, settings) {
  return [
    `Translate each item to ${settings.targetLang}.`,
    settings.sourceLang && settings.sourceLang !== "auto" ? `Source language: ${settings.sourceLang}.` : "Detect the source language.",
    "Keep meaning, names, formatting, code identifiers, URLs, and numbers intact.",
    "Return a strict JSON array of strings with the same length and order. No markdown.",
    JSON.stringify(texts)
  ].join("\n");
}

async function translateWithOpenAI(texts, settings) {
  if (!settings.openaiApiKey) {
    throw new Error("OpenAI API key is not configured. Open the extension options first.");
  }

  const response = await fetch(`${trimSlash(settings.openaiBaseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.openaiApiKey}`
    },
    body: JSON.stringify({
      model: settings.openaiModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a precise translation engine." },
        { role: "user", content: buildPrompt(texts, settings) }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return parseJsonArray(data.choices?.[0]?.message?.content, texts.length);
}

async function translateWithOllama(texts, settings) {
  const response = await fetch(`${trimSlash(settings.ollamaBaseUrl)}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: settings.ollamaModel,
      stream: false,
      messages: [
        { role: "system", content: "You are a precise translation engine. Return only valid JSON." },
        { role: "user", content: buildPrompt(texts, settings) }
      ]
    })
  });

  if (!response.ok) throw new Error(`Ollama request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return parseJsonArray(data.message?.content, texts.length);
}

function parseJsonArray(content, expectedLength) {
  const raw = String(content || "").trim();
  const match = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(match ? match[0] : raw);
  if (!Array.isArray(parsed)) throw new Error("Translator did not return a JSON array.");
  while (parsed.length < expectedLength) parsed.push("");
  return parsed.slice(0, expectedLength).map(item => String(item ?? ""));
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}
