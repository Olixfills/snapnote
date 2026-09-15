# SnapNote

Screenshot annotate + note tool for macOS. Press ⌘⇧1, drag to select a region, annotate with numbered notes or highlights, and copy the result straight to your clipboard.

## Download

Grab the build for your Mac from [`download/`](download):

- **Apple Silicon (M1/M2/M3/M4):** `SnapNote-0.1.0-arm64.dmg`
- **Intel:** `SnapNote-0.1.0-x64.dmg`

(`.zip` versions of each are also provided as an alternative to the `.dmg`.)

### First launch (unsigned build)

This build isn't signed with an Apple Developer certificate, so macOS Gatekeeper will block it on first open with a "can't be opened because it is from an unidentified developer" message. To run it anyway:

1. Open the `.dmg` and drag **SnapNote** into `/Applications`.
2. Right-click (or Control-click) **SnapNote** in Applications and choose **Open**, then confirm **Open** in the dialog that appears.
3. After that first approval, it launches normally (double-click, or via the ⌘⇧1 hotkey once running).

If macOS still refuses, run this once in Terminal and try again:

```bash
xattr -cr /Applications/SnapNote.app
```

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
