/* Drag in viewport coordinates so the 32px edge inset is not canvas-scaled. */
(() => {
  const toolbar = document.querySelector('.floating-tools');
  const storageKey = 'gx-floating-tools-position';
  const threshold = 5;
  let position = null;
  let gesture = null;
  let suppressClick = false;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      position = { x: Math.max(0, Math.min(1, saved.x)), y: Math.max(0, Math.min(1, saved.y)) };
    }
  } catch {}

  function bounds() {
    return {
      x: Math.max(0, window.innerWidth - toolbar.offsetWidth),
      y: Math.max(0, window.innerHeight - toolbar.offsetHeight)
    };
  }

  function place(x, y) {
    const max = bounds();
    const left = Math.max(0, Math.min(max.x, x));
    const top = Math.max(0, Math.min(max.y, y));
    Object.assign(toolbar.style, { left: `${left}px`, top: `${top}px`, right: 'auto', transform: 'none' });
    return { x: max.x ? left / max.x : 0, y: max.y ? top / max.y : 0 };
  }

  function renderPosition() {
    const max = bounds();
    if (position) place(position.x * max.x, position.y * max.y);
    else place(max.x - 32, max.y / 2);
  }

  function finish(event, cancel = false) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const ended = gesture;
    gesture = null;
    toolbar.classList.remove('is-dragging');
    if (ended.dragged) {
      suppressClick = true;
      if (cancel) {
        position = ended.original;
        renderPosition();
      } else {
        const rect = toolbar.getBoundingClientRect();
        position = place(rect.left, rect.top);
        try { localStorage.setItem(storageKey, JSON.stringify(position)); } catch {}
      }
    }
    if (toolbar.hasPointerCapture(ended.id)) toolbar.releasePointerCapture(ended.id);
  }

  toolbar.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    suppressClick = false;
    const rect = toolbar.getBoundingClientRect();
    gesture = {
      id: event.pointerId, startX: event.clientX, startY: event.clientY,
      left: rect.left, top: rect.top, dragged: false, original: position
    };
  });

  window.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.dragged && Math.hypot(dx, dy) < threshold) return;
    if (!gesture.dragged) {
      gesture.dragged = true;
      toolbar.setPointerCapture(event.pointerId);
      toolbar.classList.add('is-dragging');
    }
    event.preventDefault();
    place(gesture.left + dx, gesture.top + dy);
  }, { passive: false });

  window.addEventListener('pointerup', event => finish(event));
  window.addEventListener('pointercancel', event => finish(event, true));
  toolbar.addEventListener('lostpointercapture', event => finish(event, true));
  toolbar.addEventListener('dragstart', event => event.preventDefault());
  toolbar.addEventListener('click', event => {
    // Keyboard activation has detail=0 and must remain available after a drag.
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }
  }, true);

  // Recover the default position without introducing another visible control.
  toolbar.title = '拖动调整位置；双击按钮组空白处恢复默认位置';
  toolbar.setAttribute('aria-label', '工作台切换，可拖动调整位置');
  toolbar.addEventListener('dblclick', event => {
    if (event.target.closest('button')) return;
    position = null;
    try { localStorage.removeItem(storageKey); } catch {}
    renderPosition();
  });

  window.addEventListener('resize', () => {
    if (gesture) finish({ pointerId: gesture.id }, true);
    renderPosition();
  });
  new ResizeObserver(renderPosition).observe(toolbar);
  renderPosition();
})();
