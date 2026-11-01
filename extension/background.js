// Scam Detector background worker: forwards screenshots to the API server.

const DEFAULTS = { serverUrl: "http://127.0.0.1:8000", apiToken: "" };
const scamsPerTab = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "classifyImage") {
    classify(request.imageData)
      .then((verdict) => {
        if (verdict.scam && sender.tab) countScam(sender.tab.id);
        sendResponse(verdict);
      })
      .catch((error) => {
        console.warn("Scam Detector: classification failed:", error);
        sendResponse({ scam: false, error: String(error) });
      });
    return true; // respond asynchronously
  }
  return false;
});

async function classify(imageData) {
  const { serverUrl, apiToken } = await chrome.storage.local.get(DEFAULTS);
  const headers = { "Content-Type": "application/json" };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;
  const response = await fetch(`${serverUrl.replace(/\/+$/, "")}/classify-image`, {
    method: "POST",
    headers,
    body: JSON.stringify({ image_base64: imageData }),
  });
  if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
  return response.json();
}

function countScam(tabId) {
  const count = (scamsPerTab.get(tabId) || 0) + 1;
  scamsPerTab.set(tabId, count);
  chrome.action.setBadgeBackgroundColor({ color: "#d93025", tabId });
  chrome.action.setBadgeText({ text: String(count), tabId });
}

chrome.tabs.onRemoved.addListener((tabId) => scamsPerTab.delete(tabId));
