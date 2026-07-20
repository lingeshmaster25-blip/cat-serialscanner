// Preload script — runs in an isolated context with access to Node APIs
// before the page loads. Exposes a small, explicit API to the renderer
// instead of turning on nodeIntegration.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  platform: process.platform,
});

contextBridge.exposeInMainWorld("license", {
  getDeviceId: () => ipcRenderer.invoke("license:get-device-id"),
  activate: (key) => ipcRenderer.invoke("license:activate", key),
  copyDeviceId: (text) => ipcRenderer.invoke("license:copy-device-id", text),
});
