# License Activation — How It Works

The Windows app is gated behind a one-device-one-key activation screen,
matching the existing CAT EZI product flow: on first launch, the app shows
its Device ID and asks for a license key. That key is checked entirely
offline — no server, no internet connection required at activation time.

## The model

1. On first launch, the app generates a random Device ID and saves it to
   `%APPDATA%\EZI Serial Scanner\device-id.txt`. It never changes after that
   (short of the client wiping their app data).
2. A valid license key for a given Device ID is:
   `HMAC-SHA256(LICENSE_SECRET, deviceId)`, truncated to 16 hex characters
   and formatted as `XXXX-XXXX-XXXX-XXXX`.
3. Because the key is a deterministic function of the Device ID, **a key
   generated for one machine will never validate on another machine** — this
   is what gives you one-device-one-key without any central database.
4. Once a client enters a valid key, it's saved to
   `%APPDATA%\EZI Serial Scanner\license.json` and they're never asked again
   on that machine.

The logic lives in `electron/license.cjs`. The `LICENSE_SECRET` inside that
file is what lets you compute the matching key for any Device ID — treat it
like a password (see the comment at the top of that file for the full
tradeoffs of an offline-only check).

## Issuing a key to a client

1. The client sends you the Device ID shown on their activation screen.
2. Run:
   ```bash
   node scripts/generate-license-key.cjs <their-device-id>
   ```
3. Send them back the printed key. That's it — no database, no dashboard,
   no internet dependency on your end or theirs.

`scripts/generate-license-key.cjs` is **not** bundled into the shipped app
(electron-builder only packages `dist/**` and `electron/**`) — keep it, and
the repo it lives in, private to Trilo Automation.

## Testing the flow right now (before you have real client Device IDs)

10 ready-made test pairs are in `sample-keys.md` at the repo root. To try
one: run the app once so it creates `device-id.txt`, replace the contents of
that file with one of the sample Device IDs, relaunch, and enter the
matching key from the table. (This only works for those fabricated test
IDs — it doesn't let anyone bypass the check on a real machine, since a real
Device ID is randomly generated and unknown in advance.)

## Rotating the secret

If `LICENSE_SECRET` ever leaks (e.g. accidentally pushed somewhere public),
generate a new one, update `electron/license.cjs`, and ship an update.
Already-activated clients keep working only if you keep the old secret
around as a fallback check, or you'll need to re-issue keys.
