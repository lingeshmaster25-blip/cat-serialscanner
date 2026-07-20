// Electron main process — desktop (Windows) shell for the EZI Serial Scanner SPA.
//
// The web app itself (built by Vite into ../dist) is untouched: this file
// opens it in a native window, grants camera access, and gates access behind
// a one-device-one-key license check (see license.cjs for how keys work).

const { app, BrowserWindow, session, Menu, shell, ipcMain, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { isValidLicenseKey } = require("./license.cjs");

const isDev = process.env.ELECTRON_START_URL != null;

// --- Persisted per-install state -------------------------------------------------
// userData is per-OS, e.g. Windows: %APPDATA%\EZI Serial Scanner\
const userDataDir = () => app.getPath("userData");
const deviceIdFile = () => path.join(userDataDir(), "device-id.txt");
const licenseFile = () => path.join(userDataDir(), "license.json");

function getOrCreateDeviceId() {
  const file = deviceIdFile();
  try {
    const existing = fs.readFileSync(file, "utf8").trim();
    if (existing) return existing;
  } catch {
    // no file yet
  }
  const id = crypto.randomUUID();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, id, "utf8");
  return id;
}

function readLicense() {
  try {
    const raw = fs.readFileSync(licenseFile(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLicense(deviceId, key) {
  const record = { deviceId, key, activatedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(licenseFile()), { recursive: true });
  fs.writeFileSync(licenseFile(), JSON.stringify(record, null, 2), "utf8");
}

function isActivated(deviceId) {
  const license = readLicense();
  if (!license || license.deviceId !== deviceId) return false;
  return isValidLicenseKey(deviceId, license.key);
}

// --- Window -------------------------------------------------------------------

let mainWindow = null;

function loadApp(win) {
  if (isDev) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function loadActivationScreen(win) {
  win.loadFile(path.join(__dirname, "activation.html"));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 480,
    minHeight: 640,
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    autoHideMenuBar: true,
    backgroundColor: "#0b0b0c",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Tesseract.js needs to spin up a Worker + WASM
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow = win;

  const deviceId = getOrCreateDeviceId();
  if (isActivated(deviceId)) {
    loadApp(win);
  } else {
    loadActivationScreen(win);
  }

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });

  return win;
}

// --- IPC: activation screen <-> main process -----------------------------------

ipcMain.handle("license:get-device-id", () => {
  return getOrCreateDeviceId();
});

ipcMain.handle("license:activate", (event, submittedKey) => {
  const deviceId = getOrCreateDeviceId();
  if (!isValidLicenseKey(deviceId, submittedKey)) {
    return { ok: false, error: "That key doesn't match this device. Double-check it and try again." };
  }
  writeLicense(deviceId, submittedKey.trim().toUpperCase());

  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) loadApp(win);

  return { ok: true };
});

ipcMain.handle("license:copy-device-id", (_event, text) => {
  clipboard.writeText(text);
  return { ok: true };
});

// --- App lifecycle ---------------------------------------------------------------

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    if (permission === "media" || permission === "camera" || permission === "microphone") {
      callback(true);
    } else {
      callback(false);
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
