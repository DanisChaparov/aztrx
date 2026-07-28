const params = new URLSearchParams(window.location.search);
const domain = params.get("from") ?? "this site";

const messageEl = document.getElementById("message");
if (messageEl) {
  messageEl.textContent = `${domain} is on your blocklist while a session is active. Get back to work — you've got this.`;
}

chrome.runtime.sendMessage({ type: "DISTRACTION_BLOCKED", domain });
