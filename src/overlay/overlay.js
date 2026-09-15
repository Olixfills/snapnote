const selectionEl = document.getElementById('selection');
const dimsEl = document.getElementById('dims');
const hintEl = document.getElementById('hint');

let startX = 0, startY = 0;
let dragging = false;

function rectFrom(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

window.addEventListener('mousedown', (e) => {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  hintEl.style.display = 'none';
  selectionEl.style.display = 'block';
  dimsEl.style.display = 'block';
});

window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const r = rectFrom({ x: startX, y: startY }, { x: e.clientX, y: e.clientY });
  selectionEl.style.left = r.x + 'px';
  selectionEl.style.top = r.y + 'px';
  selectionEl.style.width = r.width + 'px';
  selectionEl.style.height = r.height + 'px';
  dimsEl.style.left = r.x + 'px';
  dimsEl.style.top = Math.max(0, r.y - 22) + 'px';
  dimsEl.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
});

window.addEventListener('mouseup', (e) => {
  if (!dragging) return;
  dragging = false;
  const r = rectFrom({ x: startX, y: startY }, { x: e.clientX, y: e.clientY });
  if (r.width < 6 || r.height < 6) {
    window.overlayAPI.cancel();
    return;
  }
  window.overlayAPI.select(r);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.overlayAPI.cancel();
});
