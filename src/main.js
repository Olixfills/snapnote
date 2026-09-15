const {
  app,
  BrowserWindow,
  globalShortcut,
  desktopCapturer,
  screen,
  ipcMain,
  nativeImage,
  Tray,
  Menu,
  Notification,
} = require('electron');
const path = require('path');

const HOTKEY = 'CommandOrControl+Shift+1';

let tray = null;
let overlayWin = null;
let thumbnailWin = null;
let editorWin = null;

let lastFullScreenDataUrl = null;
let captureDisplay = null;
let capturedImage = null; // nativeImage cropped to the selected region

function notifyCopied() {
  if (Notification.isSupported()) {
    new Notification({ title: 'SnapNote', body: 'Copied to clipboard' }).show();
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/trayTemplate.png'));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('SnapNote');
  const menu = Menu.buildFromTemplate([
    { label: `Capture Region (${process.platform === 'darwin' ? '⌘⇧1' : 'Ctrl+Shift+1'})`, click: startCapture },
    { type: 'separator' },
    { label: 'Quit SnapNote', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
}

async function startCapture() {
  console.log('[snapnote] startCapture invoked');
  if (overlayWin || editorWin) return; // one capture flow at a time

  const display = screen.getPrimaryDisplay();
  captureDisplay = display;
  const scaleFactor = display.scaleFactor;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: Math.round(display.size.width * scaleFactor),
      height: Math.round(display.size.height * scaleFactor),
    },
  });
  console.log('[snapnote] sources found:', sources.length);
  if (!sources.length) {
    console.error('[snapnote] no screen sources — likely missing Screen Recording permission');
    return;
  }
  lastFullScreenDataUrl = sources[0].thumbnail.toDataURL();
  console.log('[snapnote] thumbnail dataUrl length:', lastFullScreenDataUrl.length);

  overlayWin = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    fullscreenable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'overlay/preload.js'),
    },
  });
  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWin.loadFile(path.join(__dirname, 'overlay/index.html'));
  overlayWin.on('closed', () => {
    overlayWin = null;
  });
  app.focus({ steal: true });
  overlayWin.show();
  overlayWin.focus();
  overlayWin.moveTop();
}

ipcMain.on('overlay:cancel', () => {
  if (overlayWin) overlayWin.close();
});

ipcMain.on('overlay:selected', (_e, rectLogical) => {
  const scaleFactor = captureDisplay.scaleFactor;
  const full = nativeImage.createFromDataURL(lastFullScreenDataUrl);
  const cropRect = {
    x: Math.max(0, Math.round(rectLogical.x * scaleFactor)),
    y: Math.max(0, Math.round(rectLogical.y * scaleFactor)),
    width: Math.max(1, Math.round(rectLogical.width * scaleFactor)),
    height: Math.max(1, Math.round(rectLogical.height * scaleFactor)),
  };
  capturedImage = full.crop(cropRect);
  if (overlayWin) overlayWin.close();
  showThumbnail();
});

function showThumbnail() {
  const size = capturedImage.getSize();
  const thumbW = 170;
  const thumbH = Math.max(60, Math.round(thumbW * (size.height / size.width)));
  const display = screen.getPrimaryDisplay();

  thumbnailWin = new BrowserWindow({
    x: display.workArea.x + 24,
    y: display.workArea.y + display.workArea.height - thumbH - 110,
    width: thumbW + 24,
    height: thumbH + 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'thumbnail/preload.js'),
    },
  });
  thumbnailWin.setAlwaysOnTop(true, 'screen-saver');
  thumbnailWin.loadFile(path.join(__dirname, 'thumbnail/index.html'));
  thumbnailWin.webContents.once('did-finish-load', () => {
    thumbnailWin.webContents.send('thumbnail:image', capturedImage.toDataURL());
  });
  thumbnailWin.on('closed', () => {
    thumbnailWin = null;
  });
}

ipcMain.on('thumbnail:copied', () => {
  notifyCopied();
});

ipcMain.on('thumbnail:dismiss', () => {
  capturedImage = null;
  if (thumbnailWin) thumbnailWin.close();
});

ipcMain.on('thumbnail:edit', () => {
  if (thumbnailWin) thumbnailWin.close();
  openEditor();
});

ipcMain.on('thumbnail:rendererError', (_e, message) => {
  console.error('[snapnote] renderer error in thumbnail:', message);
});

function openEditor() {
  editorWin = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 780,
    minHeight: 560,
    title: 'SnapNote',
    backgroundColor: '#1c1c1e',
    webPreferences: {
      preload: path.join(__dirname, 'editor/preload.js'),
    },
  });
  editorWin.loadFile(path.join(__dirname, 'editor/index.html'));
  editorWin.webContents.once('did-finish-load', () => {
    editorWin.webContents.send('editor:image', capturedImage.toDataURL());
  });
  editorWin.on('closed', () => {
    editorWin = null;
    capturedImage = null;
  });
}

ipcMain.on('editor:cancel', () => {
  if (editorWin) editorWin.close();
});

ipcMain.on('editor:copied', () => {
  notifyCopied();
  if (editorWin) editorWin.close();
});

ipcMain.on('editor:rendererError', (_e, message) => {
  console.error('[snapnote] renderer error in editor:', message);
});

app.whenReady().then(() => {
  console.log('[snapnote] ready, platform=', process.platform);
  if (process.platform === 'darwin') app.dock.hide();
  try {
    createTray();
    console.log('[snapnote] tray created, isDestroyed=', tray.isDestroyed());
  } catch (err) {
    console.error('[snapnote] tray creation failed', err);
  }
  const ok = globalShortcut.register(HOTKEY, startCapture);
  console.log('[snapnote] shortcut registered:', ok, 'isRegistered:', globalShortcut.isRegistered(HOTKEY));
}).catch((err) => {
  console.error('[snapnote] whenReady failed', err);
});

process.on('uncaughtException', (err) => {
  console.error('[snapnote] uncaughtException', err);
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
