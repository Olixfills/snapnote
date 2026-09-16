# SnapNote

Screenshot annotate + note tool for macOS. Press ⌘⇧1, drag to select a region, annotate with numbered notes or highlights, and copy the result straight to your clipboard.

## Download

Grab the build for your Mac from the [Releases page](https://github.com/Olixfills/snapnote/releases/latest):

- **Apple Silicon (M1/M2/M3/M4):** `SnapNote-0.1.0-arm64.dmg`
- **Intel:** `SnapNote-0.1.0-x64.dmg`

(`.zip` versions of each are also provided as an alternative to the `.dmg`.)

### First launch (unsigned build)

This build isn't signed with a paid Apple Developer ID or notarized, so Gatekeeper blocks it on first open. On current macOS, the dialog you'll see (**"SnapNote" Not Opened** / "Apple could not verify...") only offers **Move to Trash** or **Done** — there's no inline Open button, and it typically won't offer an "Open Anyway" override in System Settings either for a build like this. Right-click → Open does **not** bypass this.

The reliable fix is to clear the quarantine flag macOS attaches to anything downloaded from a browser, **before** you launch it the first time:

1. Open the `.dmg` and drag **SnapNote** into `/Applications` (or unzip the `.zip` there).
2. Open Terminal and run:
   ```bash
   xattr -cr /Applications/SnapNote.app
   ```
3. Now double-click **SnapNote** as normal — it launches with no Gatekeeper prompt at all.

This is safe: `xattr -cr` only strips the "downloaded from the internet" marker from this one file, it doesn't change any system security settings. You only need to do it once per install.

## Usage

1. Launch SnapNote — it runs in the background (menu bar only, no Dock icon).
2. Press **⌘⇧1** and drag to select a screen region.
3. A thumbnail appears bottom-left:
   - Do nothing for 5 seconds → the screenshot is copied to your clipboard automatically.
   - Click **Close** → copies immediately and dismisses.
   - Click **Edit** → opens the annotation editor.
4. In the editor, drag to draw a **Note** box (adds a numbered pin + a text note) or switch to **Highlight** for a plain marked area with no note.
5. Click **Copy & Close** to copy the final image — if you added any notes, it's composited with a "Notes" panel alongside the screenshot; otherwise it's just the annotated screenshot.

## Development

```bash
npm install
npm start
```

## Building

```bash
npm run dist:mac
```

Produces unsigned `.dmg`/`.zip` builds for both Intel and Apple Silicon into `download/`.
