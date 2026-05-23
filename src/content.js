const BLOCK_SELECTOR = [
  "article p",
  "main p",
  "section p",
  "p",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "td",
  "th"
].join(",");

const SKIP_SELECTOR = [
  "script",
  "style",
  "code",
  "pre",
  "textarea",
  "input",
  "select",
  "button",
  "[contenteditable=true]",
  ".lit-translation",
  ".lit-popover",
  ".lit-floating-ball"
].join(",");

let pageTranslated = false;
let popover;
let floatingBall;

ensureFloatingBall();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "TOGGLE_PAGE_TRANSLATION") {
    togglePageTranslation();
    sendResponse?.({ ok: true });
  }

  if (message?.type === "TRANSLATE_SELECTION_TEXT") {
    translateSelectionText(message.text || getSelectionText());
    sendResponse?.({ ok: true });
  }
});

document.addEventListener("mouseup", () => {
  const text = getSelectionText();
  if (text.length >= 2) showSelectionButton(text);
});

async function togglePageTranslation() {
  if (pageTranslated) {
    removeTranslations();
    pageTranslated = false;
    updateFloatingBall("idle");
    return;
  }

  pageTranslated = true;
  updateFloatingBall("loading");
  await translatePage();
  updateFloatingBall("active");
}

async function translatePage() {
  const blocks = collectBlocks().slice(0, 160);
  const queue = blocks.filter(block => !block.nextElementSibling?.classList?.contains("lit-translation"));
  const batchSize = 6;

  for (let i = 0; i < queue.length; i += batchSize) {
    const batch = queue.slice(i, i + batchSize);
    batch.forEach(block => block.classList.add("lit-translating"));
    try {
      const translations = await requestTranslations(batch.map(block => block.innerText.trim()));
      batch.forEach((block, index) => insertTranslation(block, translations[index]));
    } catch (error) {
      batch.forEach(block => insertTranslation(block, `Translation failed: ${error.message || error}`));
    } finally {
      batch.forEach(block => block.classList.remove("lit-translating"));
    }
  }
}

function collectBlocks() {
  return Array.from(document.querySelectorAll(BLOCK_SELECTOR)).filter(element => {
    if (element.closest(SKIP_SELECTOR)) return false;
    if (!isVisible(element)) return false;
    const text = element.innerText?.trim() || "";
    if (text.length < 18) return false;
    if (/^[\d\s.,:;!?()[\]{}'"-+*/\\|<>=%]+$/.test(text)) return false;
    if (element.querySelector(".lit-translation")) return false;
    return true;
  });
}

function insertTranslation(block, text) {
  if (!text || block.nextElementSibling?.classList?.contains("lit-translation")) return;
  const node = document.createElement("div");
  node.className = "lit-translation";
  node.textContent = text;
  block.insertAdjacentElement("afterend", node);
}

function removeTranslations() {
  document.querySelectorAll(".lit-translation, .lit-popover").forEach(node => node.remove());
}

function ensureFloatingBall() {
  if (floatingBall) return;

  const existing = document.querySelector(".lit-floating-ball");
  if (existing) {
    floatingBall = existing;
    return;
  }

  floatingBall = document.createElement("button");
  floatingBall.type = "button";
  floatingBall.className = "lit-floating-ball";
  floatingBall.title = "Translate page";
  floatingBall.setAttribute("aria-label", "Translate page");
  floatingBall.textContent = "译";
  document.documentElement.appendChild(floatingBall);

  floatingBall.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    togglePageTranslation();
  });
}

function updateFloatingBall(state) {
  ensureFloatingBall();
  floatingBall.dataset.state = state;
  if (state === "loading") {
    floatingBall.textContent = "...";
    floatingBall.title = "Translating...";
  } else if (state === "active") {
    floatingBall.textContent = "✓";
    floatingBall.title = "Remove translation";
  } else {
    floatingBall.textContent = "译";
    floatingBall.title = "Translate page";
  }
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function getSelectionText() {
  return String(window.getSelection()?.toString() || "").trim();
}

function showSelectionButton(text) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  if (!rect.width && !rect.height) return;

  ensurePopover();
  popover.innerHTML = "<small>Translating...</small>";
  popover.style.left = `${Math.min(rect.left, window.innerWidth - 480)}px`;
  popover.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 120)}px`;
  popover.hidden = false;

  translateSelectionText(text);
}

async function translateSelectionText(text) {
  if (!text.trim()) return;
  ensurePopover();
  popover.hidden = false;
  popover.innerHTML = "<small>Translating...</small>";
  try {
    const [translated] = await requestTranslations([text.trim()]);
    popover.innerHTML = `<small>Translation</small>${escapeHtml(translated)}`;
  } catch (error) {
    popover.innerHTML = `<small>Error</small>${escapeHtml(error.message || String(error))}`;
  }
}

function ensurePopover() {
  if (popover) return;
  popover = document.createElement("div");
  popover.className = "lit-popover";
  popover.hidden = true;
  document.documentElement.appendChild(popover);

  document.addEventListener("mousedown", event => {
    if (popover && !popover.contains(event.target)) popover.hidden = true;
  });
}

function requestTranslations(texts) {
  return chrome.runtime.sendMessage({ type: "TRANSLATE_TEXTS", texts }).then(response => {
    if (!response?.ok) throw new Error(response?.error || "Translation request failed.");
    return response.result;
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}
