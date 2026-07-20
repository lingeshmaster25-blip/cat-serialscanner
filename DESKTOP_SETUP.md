# EZI Serial Scanner — Windows Desktop Build

The mobile app (Capacitor/Android/iOS) is unchanged. This adds a Windows
desktop build of the exact same web app, wrapped in Electron.

## What was added

- `electron/main.cjs` — opens the built app (`dist/index.html`) in a native
  window, auto-grants camera access (needed for scanning), removes the
  default File/Edit/View menu.
- `electron/preload.cjs` — isolated preload script exposing a small
  `window.license` API (get device ID / activate) to the renderer.
- `electron/license.cjs`, `electron/activation.html/css/js` — the
  device-bound license check and its UI (see `LICENSING.md`).
- `build/icon.ico` — app icon generated from `public/cat-logo.png`.
- `"build"` block in `package.json` — electron-builder config: produces
  both an NSIS installer and a portable `.exe` for x64 Windows.
- `.github/workflows/build-windows.yml` — builds the `.exe` on GitHub's
  own Windows runner, no Windows machine required on your end.

See `LICENSING.md` for how the one-device-one-key activation check works
and how to issue a key to a client.

## Option A — Build via GitHub Actions (recommended, no local Windows needed)

1. Push this repo to GitHub.
2. Go to the **Actions** tab → **Build Windows App** → **Run workflow**
   (or just push to `main` — it runs automatically).
3. When it finishes, open the run and download the
   **EZI-Serial-Scanner-Windows** artifact. It contains:
   - `EZI Serial Scanner Setup <version>.exe` — installer (Start Menu +
     desktop shortcut)
   - `EZI Serial Scanner <version>.exe` — portable, no install needed
4. To also attach the `.exe` to a GitHub Release, push a tag like `v1.0.0`.

## Option B — Build locally on a Windows machine

```bash
npm install
npm run electron:build
```

Output lands in `release/`.

## Option C — Run it without packaging (quick test)

```bash
npm install
npm run build
npm run electron:start
```

## Notes

- The app talks to the camera the same way it does on mobile
  (`getUserMedia`); Electron auto-grants the permission (see
  `session.setPermissionRequestHandler` in `electron/main.cjs`), so no
  Windows permission prompt blocks it.
- OCR still runs with Tesseract.js locally by default. To point it at the
  server-side OCR backend instead, set `VITE_OCR_API` before building:
  `VITE_OCR_API=https://your-ocr-server.com npm run build`.
- `release/` is git-ignored — don't commit built executables, let the
  workflow (or your own machine) regenerate them.
