document.getElementById("translatePage").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return setStatus("没有可用的当前标签页。");
  await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PAGE_TRANSLATION" });
  setStatus("已切换页面翻译。");
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function setStatus(text) {
  document.getElementById("status").textContent = text;
}
