const AUTO_COPY_MS = 5000;

let lastDataUrl = null;
let autoTimer = null;
let settled = false; // becomes true once we've copied+closed once, to avoid double-copy

async function copyToClipboard() {
  if (!lastDataUrl) return false;
  try {
    const blob = await (await fetch(lastDataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    window.thumbnailAPI.copied();
    return true;
  } catch (err) {
    window.thumbnailAPI.reportError(String(err && err.stack ? err.stack : err));
    return false;
  }
}

function clearAutoTimer() {
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

window.thumbnailAPI.onImage((dataUrl) => {
  lastDataUrl = dataUrl;
  document.getElementById('shot').src = dataUrl;

  autoTimer = setTimeout(async () => {
    if (settled) return;
    settled = true;
    await copyToClipboard();
    window.thumbnailAPI.dismiss();
  }, AUTO_COPY_MS);
});

document.getElementById('edit').addEventListener('click', () => {
  if (settled) return;
  settled = true;
  clearAutoTimer();
  window.thumbnailAPI.edit();
});

document.getElementById('close').addEventListener('click', async () => {
  if (settled) return;
  settled = true;
  clearAutoTimer();
  await copyToClipboard();
  window.thumbnailAPI.dismiss();
});
