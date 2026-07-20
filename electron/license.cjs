// Device-bound license key logic — offline, no server required.
//
// How it works:
//   1. Each installed copy of the app has a random Device ID, generated once
//      and stored locally (see main.cjs).
//   2. A valid license key for that Device ID is HMAC-SHA256(secret, deviceId),
//      truncated and formatted as XXXX-XXXX-XXXX-XXXX.
//   3. Because the key is a deterministic function of the Device ID, a key
//      issued for one device will never validate on another device.
//
// CONFIDENTIAL: LICENSE_SECRET is what lets Trilo Automation compute the one
// valid key for a given Device ID (see scripts/generate-license-key.cjs at
// the repo root). Treat it like a password:
//   - Don't post it publicly (GitHub issues, chat, etc).
//   - It does ship inside the packaged Windows app (asar archive) because the
//     app has to be able to check keys with no internet connection — that's
//     the tradeoff of a fully offline license check. A determined person
//     with reverse-engineering tools could extract it from the .exe. This
//     matches how most small offline-licensed desktop tools work; if you
//     need stronger protection later, move validation to a server (Cloudflare
//     Worker) that checks a key/device database instead.
//   - If it ever leaks, generate a new one, ship an app update, and
//     previously activated devices keep working only if you keep validating
//     old keys too (or ask clients to re-activate with new keys).

const crypto = require("crypto");

const LICENSE_SECRET = "30d17b8b84a5644d3e06d6e8a0b5d9f2a5d0554144b310a8cb96b7c9a639f74f";

function deriveLicenseKey(deviceId, secret = LICENSE_SECRET) {
  const normalized = String(deviceId).trim().toLowerCase();
  const digest = crypto.createHmac("sha256", secret).update(normalized).digest("hex");
  const code = digest.slice(0, 16).toUpperCase();
  return code.match(/.{1,4}/g).join("-");
}

function normalizeKeyInput(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-F0-9]/g, "");
}

function formatKey(rawHex) {
  const groups = rawHex.match(/.{1,4}/g);
  return groups ? groups.join("-") : rawHex;
}

function isValidLicenseKey(deviceId, inputKey) {
  const expected = deriveLicenseKey(deviceId).replace(/-/g, "");
  const given = normalizeKeyInput(inputKey);
  if (given.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  } catch {
    return false;
  }
}

module.exports = {
  deriveLicenseKey,
  isValidLicenseKey,
  normalizeKeyInput,
  formatKey,
};
