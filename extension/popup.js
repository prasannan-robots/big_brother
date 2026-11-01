const DEFAULTS = { monitoring: false, serverUrl: "http://127.0.0.1:8000", apiToken: "" };
const $ = (id) => document.getElementById(id);

function showStatus(on) {
  $("status").innerHTML = "";
  const strong = document.createElement("strong");
  strong.textContent = on ? "Monitoring is ON" : "Monitoring is OFF";
  $("status").append(strong);
}

chrome.storage.local.get(DEFAULTS, (data) => {
  $("toggle").checked = data.monitoring;
  $("serverUrl").value = data.serverUrl;
  $("apiToken").value = data.apiToken;
  showStatus(data.monitoring);
});

// Content scripts listen to chrome.storage, so storing the value is enough.
$("toggle").addEventListener("change", () => {
  const monitoring = $("toggle").checked;
  chrome.storage.local.set({ monitoring });
  showStatus(monitoring);
});

$("save").addEventListener("click", async () => {
  const serverUrl = $("serverUrl").value.trim().replace(/\/+$/, "") || DEFAULTS.serverUrl;
  const apiToken = $("apiToken").value.trim();
  const message = $("message");
  try {
    const url = new URL(serverUrl);
    const local = ["127.0.0.1", "localhost"].includes(url.hostname);
    if (!local) {
      const granted = await chrome.permissions.request({ origins: [`${url.origin}/*`] });
      if (!granted) { message.textContent = "Permission to reach that server was denied."; return; }
    }
    await chrome.storage.local.set({ serverUrl, apiToken });
    const response = await fetch(`${serverUrl}/health`);
    const health = await response.json();
    message.textContent = health.ok
      ? `Connected.${health.auth_required && !apiToken ? " The server needs an API token." : ""}`
      : "The server responded unexpectedly.";
  } catch (error) {
    message.textContent = `Couldn't reach the server: ${error.message}`;
  }
});
