// Scam Detector content script: screenshots feed posts as they scroll into
// view and asks the background worker to classify them.

const SITES = {
  "instagram.com": "article",
  // The old selector contained a literal "{n}", so it never matched.
  "facebook.com": 'div[data-pagelet^="FeedUnit_"], div[aria-posinset]',
  "x.com": 'article[data-testid="tweet"]',
  "twitter.com": 'article[data-testid="tweet"]',
};

const host = location.hostname;
const selector = Object.entries(SITES).find(([site]) => host === site || host.endsWith("." + site))?.[1];

let monitoring = false;
const seen = new WeakSet();
let queue = Promise.resolve();
let discoverTimer = null;

// Only classify posts the user actually sees (each check is a paid API call).
const visibility = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    visibility.unobserve(entry.target);
    queue = queue.then(() => check(entry.target)).catch((error) => console.debug("[Scam Detector]", error));
  }
}, { threshold: 0.5 });

async function check(post) {
  if (!monitoring || !post.isConnected) return;
  const scale = Math.min(1, 900 / Math.max(post.offsetWidth, 1));
  const canvas = await html2canvas(post, { useCORS: true, logging: false, scale });
  const imageData = canvas.toDataURL("image/jpeg", 0.8); // far smaller than PNG
  const response = await chrome.runtime.sendMessage({ action: "classifyImage", imageData });
  if (response?.scam) markAsScam(post, response);
}

function markAsScam(post, verdict) {
  if (post.querySelector(":scope > .scam-detector-warning")) return;
  post.style.outline = "3px solid #ff5050";
  post.style.outlineOffset = "-3px";
  const warning = document.createElement("div");
  warning.className = "scam-detector-warning";
  Object.assign(warning.style, {
    color: "#b3261e", background: "#fdecea", border: "1px solid #f5c2c0", borderRadius: "8px",
    padding: "10px 12px", margin: "8px", font: "600 14px/1.4 system-ui, Arial, sans-serif",
  });
  const title = document.createElement("div");
  title.textContent = "⚠️ Possible scam" + (verdict.target && verdict.target !== "none" ? ` targeting ${verdict.target}` : "");
  warning.append(title);
  if (verdict.reason) {
    const reason = document.createElement("div");
    reason.style.fontWeight = "400";
    reason.textContent = verdict.reason;
    warning.append(reason);
  }
  post.prepend(warning);
}

function discover() {
  if (!monitoring || !selector) return;
  for (const post of document.querySelectorAll(selector)) {
    if (seen.has(post)) continue;
    seen.add(post);
    visibility.observe(post);
  }
}

function scheduleDiscover() {
  clearTimeout(discoverTimer);
  discoverTimer = setTimeout(discover, 300);
}

function setMonitoring(on) {
  monitoring = on;
  if (on) scheduleDiscover();
}

if (selector) {
  // The popup stores the switch in chrome.storage; every tab follows it.
  chrome.storage.local.get({ monitoring: false }, (data) => setMonitoring(Boolean(data.monitoring)));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.monitoring) setMonitoring(Boolean(changes.monitoring.newValue));
  });
  new MutationObserver(scheduleDiscover).observe(document.documentElement, { childList: true, subtree: true });
}
