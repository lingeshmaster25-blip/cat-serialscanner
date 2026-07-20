const deviceIdInput = document.getElementById("device-id");
const copyBtn = document.getElementById("copy-btn");
const keyInput = document.getElementById("license-key");
const errorMsg = document.getElementById("error-msg");
const activateBtn = document.getElementById("activate-btn");

let deviceId = "";

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.hidden = true;
  errorMsg.textContent = "";
}

function formatKeyInput(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return clean.match(/.{1,4}/g)?.join("-") ?? clean;
}

async function init() {
  deviceId = await window.license.getDeviceId();
  deviceIdInput.value = deviceId;
}

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(deviceId);
  } catch {
    await window.license.copyDeviceId(deviceId);
  }
  const original = copyBtn.textContent;
  copyBtn.textContent = "Copied";
  setTimeout(() => (copyBtn.textContent = original), 1500);
});

keyInput.addEventListener("input", (e) => {
  const cursorWasAtEnd = e.target.selectionStart === e.target.value.length;
  e.target.value = formatKeyInput(e.target.value);
  if (cursorWasAtEnd) {
    e.target.selectionStart = e.target.selectionEnd = e.target.value.length;
  }
  clearError();
});

keyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") activate();
});

activateBtn.addEventListener("click", activate);

async function activate() {
  const key = keyInput.value.trim();
  if (key.replace(/-/g, "").length !== 16) {
    showError("Enter the full 16-character license key.");
    return;
  }

  clearError();
  activateBtn.disabled = true;
  activateBtn.textContent = "Activating…";

  try {
    const result = await window.license.activate(key);
    if (!result.ok) {
      showError(result.error || "Invalid license key.");
      activateBtn.disabled = false;
      activateBtn.textContent = "Activate";
    }
    // On success, the main process swaps this window's contents to the app —
    // nothing further to do here.
  } catch (err) {
    showError("Something went wrong activating this key. Try again.");
    activateBtn.disabled = false;
    activateBtn.textContent = "Activate";
  }
}

init();
