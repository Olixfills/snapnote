const shot = document.getElementById('shot');
const annLayer = document.getElementById('annLayer');
const dragBox = document.getElementById('dragBox');
const imageWrap = document.getElementById('imageWrap');
const notePopup = document.getElementById('notePopup');
const noteText = document.getElementById('noteText');

let naturalW = 0, naturalH = 0;
let annotations = []; // {id, type:'note'|'highlight', x,y,w,h (natural coords), number, text}
let nextNumber = 1;
let currentTool = 'note';
let dragStart = null;
let editingId = null; // annotation currently shown in the note popup
let pendingAnnotation = null; // annotation created by an in-progress drag, not yet confirmed

document.querySelectorAll('.tool').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
  });
});

window.editorAPI.onImage((dataUrl) => {
  shot.src = dataUrl;
});
shot.addEventListener('load', () => {
  naturalW = shot.naturalWidth;
  naturalH = shot.naturalHeight;
});

function scale() {
  const rect = shot.getBoundingClientRect();
  return { sx: rect.width / naturalW, sy: rect.height / naturalH };
}

function toNatural(px, py) {
  const { sx, sy } = scale();
  return { x: px / sx, y: py / sy };
}

function localPoint(e) {
  const rect = imageWrap.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

imageWrap.addEventListener('mousedown', (e) => {
  if (e.target.closest('.ann-box') || e.target.closest('.ann-pin')) return;
  dragStart = localPoint(e);
  dragBox.style.display = 'block';
  dragBox.style.left = dragStart.x + 'px';
  dragBox.style.top = dragStart.y + 'px';
  dragBox.style.width = '0px';
  dragBox.style.height = '0px';
});

window.addEventListener('mousemove', (e) => {
  if (!dragStart) return;
  const p = localPoint(e);
  const x = Math.min(dragStart.x, p.x);
  const y = Math.min(dragStart.y, p.y);
  const w = Math.abs(p.x - dragStart.x);
  const h = Math.abs(p.y - dragStart.y);
  dragBox.style.left = x + 'px';
  dragBox.style.top = y + 'px';
  dragBox.style.width = w + 'px';
  dragBox.style.height = h + 'px';
});

window.addEventListener('mouseup', (e) => {
  if (!dragStart) return;
  const p = localPoint(e);
  const x = Math.min(dragStart.x, p.x);
  const y = Math.min(dragStart.y, p.y);
  const w = Math.abs(p.x - dragStart.x);
  const h = Math.abs(p.y - dragStart.y);
  dragStart = null;
  dragBox.style.display = 'none';

  if (w < 8 || h < 8) return;

  const topLeft = toNatural(x, y);
  const size = toNatural(w, h);
  const rectNatural = { x: topLeft.x, y: topLeft.y, w: size.x, h: size.y };

  if (currentTool === 'highlight') {
    annotations.push({ id: crypto.randomUUID(), type: 'highlight', ...rectNatural });
    render();
    return;
  }

  // note tool: create a pending annotation and ask for text
  pendingAnnotation = { id: crypto.randomUUID(), type: 'note', number: nextNumber, text: '', ...rectNatural };
  openPopup(pendingAnnotation, x + w / 2, y + h);
});

function openPopup(ann, anchorX, anchorY) {
  editingId = ann.id;
  noteText.value = ann.text || '';
  notePopup.classList.remove('hidden');
  const wrapRect = imageWrap.getBoundingClientRect();
  let left = wrapRect.left + anchorX + 12;
  let top = wrapRect.top + anchorY + 12;
  const maxLeft = window.innerWidth - 300;
  const maxTop = window.innerHeight - 160;
  if (left > maxLeft) left = maxLeft;
  if (top > maxTop) top = maxTop;
  notePopup.style.left = Math.max(12, left) + 'px';
  notePopup.style.top = Math.max(12, top) + 'px';
  noteText.focus();
}

function closePopup() {
  notePopup.classList.add('hidden');
  editingId = null;
  pendingAnnotation = null;
}

document.getElementById('noteSave').addEventListener('click', () => {
  const text = noteText.value.trim();
  if (pendingAnnotation) {
    if (text) {
      pendingAnnotation.text = text;
      annotations.push(pendingAnnotation);
      nextNumber += 1;
    }
    pendingAnnotation = null;
  } else if (editingId) {
    const ann = annotations.find((a) => a.id === editingId);
    if (ann) {
      if (text) {
        ann.text = text;
      } else {
        annotations = annotations.filter((a) => a.id !== editingId);
        renumber();
      }
    }
  }
  closePopup();
  render();
});

document.getElementById('noteDelete').addEventListener('click', () => {
  const id = pendingAnnotation ? pendingAnnotation.id : editingId;
  annotations = annotations.filter((a) => a.id !== id);
  renumber();
  closePopup();
  render();
});

function renumber() {
  let n = 1;
  annotations
    .filter((a) => a.type === 'note')
    .forEach((a) => {
      a.number = n++;
    });
  nextNumber = n;
}

document.getElementById('undoBtn').addEventListener('click', () => {
  annotations.pop();
  renumber();
  render();
});
document.getElementById('clearBtn').addEventListener('click', () => {
  annotations = [];
  nextNumber = 1;
  render();
});

function render() {
  annLayer.innerHTML = '';
  const { sx, sy } = scale();
  annotations.forEach((ann) => {
    const box = document.createElement('div');
    box.className = 'ann-box' + (ann.type === 'highlight' ? ' highlight' : '');
    box.style.left = ann.x * sx + 'px';
    box.style.top = ann.y * sy + 'px';
    box.style.width = ann.w * sx + 'px';
    box.style.height = ann.h * sy + 'px';
    if (ann.type === 'note') {
      const pin = document.createElement('div');
      pin.className = 'ann-pin';
      pin.textContent = ann.number;
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        const local = { x: ann.x * sx, y: ann.y * sy };
        openPopup(ann, local.x, local.y);
      });
      box.appendChild(pin);
      box.addEventListener('click', (e) => {
        e.stopPropagation();
        const local = { x: ann.x * sx, y: ann.y * sy };
        openPopup(ann, local.x, local.y);
      });
    }
    annLayer.appendChild(box);
  });
}

window.addEventListener('resize', render);

document.getElementById('cancelBtn').addEventListener('click', () => {
  window.editorAPI.cancel();
});

document.getElementById('copyCloseBtn').addEventListener('click', () => {
  try {
    const canvas = buildComposite();
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        window.editorAPI.copied();
      } catch (err) {
        window.editorAPI.reportError(String(err && err.stack ? err.stack : err));
      }
    }, 'image/png');
  } catch (err) {
    window.editorAPI.reportError(String(err && err.stack ? err.stack : err));
  }
});

window.addEventListener('error', (e) => {
  window.editorAPI.reportError(e.message + ' @ ' + e.filename + ':' + e.lineno);
});

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildComposite() {
  const notes = annotations.filter((a) => a.type === 'note').sort((a, b) => a.number - b.number);
  const PANEL_W = notes.length ? 420 : 0;
  const PAD = 32;

  const rightW = naturalW;
  const rightH = naturalH;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '15px -apple-system, system-ui, sans-serif';

  let panelH = rightH;

  if (PANEL_W > 0) {
    // Pre-measure notes panel height
    const textMaxWidth = PANEL_W - PAD * 2 - 40;
    let panelContentHeight = 90; // title + spacing
    const measuredLines = notes.map((n) => {
      ctx.font = '14px -apple-system, system-ui, sans-serif';
      const lines = wrapText(ctx, n.text, textMaxWidth);
      panelContentHeight += Math.max(36, lines.length * 20 + 16) + 14;
      return lines;
    });
    const footerH = 50;
    panelH = Math.max(rightH, panelContentHeight + footerH);

    canvas.width = PANEL_W + rightW;
    canvas.height = panelH;

    // Left panel background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PANEL_W, panelH);

    // Title
    ctx.fillStyle = '#111111';
    ctx.font = '700 24px -apple-system, system-ui, sans-serif';
    ctx.fillText('Notes', PAD, 48);
    ctx.strokeStyle = '#e5e5e5';
    ctx.beginPath();
    ctx.moveTo(PAD, 64);
    ctx.lineTo(PANEL_W - PAD, 64);
    ctx.stroke();

    let cursorY = 96;
    notes.forEach((n, i) => {
      const lines = measuredLines[i];
      const circleR = 13;
      const circleCx = PAD + circleR;
      const circleCy = cursorY;
      ctx.fillStyle = '#ff3b6b';
      ctx.beginPath();
      ctx.arc(circleCx, circleCy, circleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n.number), circleCx, circleCy + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#222222';
      ctx.font = '14px -apple-system, system-ui, sans-serif';
      let lineY = cursorY - 4;
      lines.forEach((line, li) => {
        ctx.fillText(line, PAD + 40, lineY + li * 20);
      });
      const blockH = Math.max(36, lines.length * 20 + 16);
      cursorY += blockH + 14;

      ctx.strokeStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.moveTo(PAD, cursorY - 8);
      ctx.lineTo(PANEL_W - PAD, cursorY - 8);
      ctx.stroke();
    });

    // Footer branding
    const footerY = panelH - 26;
    ctx.fillStyle = '#ff3b6b';
    ctx.beginPath();
    ctx.arc(PAD + 6, footerY - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#999999';
    ctx.font = '600 12px -apple-system, system-ui, sans-serif';
    ctx.fillText('Made with SnapNote', PAD + 20, footerY);
  } else {
    canvas.width = rightW;
    canvas.height = rightH;
  }

  // Right panel: screenshot
  ctx.drawImage(shot, PANEL_W, 0, rightW, rightH);

  // Divider between panels
  ctx.strokeStyle = '#d8d8d8';
  ctx.beginPath();
  ctx.moveTo(PANEL_W, 0);
  ctx.lineTo(PANEL_W, panelH);
  ctx.stroke();

  // Annotation overlays on screenshot
  annotations.forEach((ann) => {
    const x = PANEL_W + ann.x;
    const y = ann.y;
    if (ann.type === 'highlight') {
      ctx.fillStyle = 'rgba(255,59,107,0.28)';
      ctx.fillRect(x, y, ann.w, ann.h);
      ctx.strokeStyle = 'rgba(255,59,107,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, ann.w, ann.h);
    } else {
      ctx.strokeStyle = '#ff3b6b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, ann.w, ann.h);

      const pinCx = x + ann.w / 2;
      const pinCy = y - 18;
      ctx.strokeStyle = '#ff3b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pinCx, pinCy + 14);
      ctx.lineTo(pinCx, y);
      ctx.stroke();

      ctx.fillStyle = '#ff3b6b';
      ctx.beginPath();
      ctx.arc(pinCx, pinCy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ann.number), pinCx, pinCy + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  });

  return canvas;
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !notePopup.classList.contains('hidden')) {
    if (pendingAnnotation) {
      pendingAnnotation = null;
    }
    closePopup();
  }
});
