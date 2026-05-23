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

load();

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.batchSize = Number(data.batchSize || DEFAULT_SETTINGS.batchSize);
  await chrome.storage.sync.set(data);
  statusNode.textContent = "Saved.";
  setTimeout(() => {
    statusNode.textContent = "";
  }, 1800);
});

async function load() {
  const settings = { ...DEFAULT_SETTINGS, ...(await chrome.storage.sync.get(DEFAULT_SETTINGS)) };
  for (const [key, value] of Object.entries(settings)) {
    if (form.elements[key]) form.elements[key].value = value;
  }
}
