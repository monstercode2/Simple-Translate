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

const form = document.getElementById("form");
const statusNode = document.getElementById("status");
const providerSelect = document.getElementById("provider");
const providerHelp = document.getElementById("providerHelp");

load();

providerSelect.addEventListener("change", updateProviderGuide);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.batchSize = Number(data.batchSize || DEFAULT_SETTINGS.batchSize);
  await chrome.storage.sync.set(data);
  statusNode.textContent = "已保存。";
  setTimeout(() => {
    statusNode.textContent = "";
  }, 1800);
});

async function load() {
  const settings = { ...DEFAULT_SETTINGS, ...(await chrome.storage.sync.get(DEFAULT_SETTINGS)) };
  for (const [key, value] of Object.entries(settings)) {
    if (form.elements[key]) form.elements[key].value = value;
  }
  updateProviderGuide();
}

function updateProviderGuide() {
  const provider = providerSelect.value;
  providerHelp.textContent = provider === "ollama"
    ? "适合本地私有翻译。使用前请确认 Ollama 已经启动。"
    : "适合已有在线 API Key、代理网关或兼容模型服务的场景。";

  document.querySelectorAll("[data-provider-panel]").forEach(panel => {
    const isActive = panel.dataset.providerPanel === provider;
    panel.setAttribute("aria-disabled", String(!isActive));
  });
}
