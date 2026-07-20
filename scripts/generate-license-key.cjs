#!/usr/bin/env node
// INTERNAL Trilo Automation tool — do not send this file to clients.
//
// Usage:
//   node scripts/generate-license-key.cjs <device-id>
//
// Run this whenever a client sends you the Device ID shown on their
// "Activate Your License" screen. It prints the one key that will validate
// on that specific machine and no other.

const { deriveLicenseKey } = require("../electron/license.cjs");

const deviceId = process.argv[2];

if (!deviceId) {
  console.error("Usage: node scripts/generate-license-key.cjs <device-id>");
  process.exit(1);
}

console.log(deriveLicenseKey(deviceId));
