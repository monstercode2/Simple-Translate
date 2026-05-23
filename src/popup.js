document.getElementById("translatePage").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return setStatus("No active tab.");
  await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PAGE_TRANSLATION" });
  setStatus("Translation toggled.");
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function setStatus(text) {
  document.getElementById("status").textContent = text;
}
