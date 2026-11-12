(function () {
  'use strict';
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const out = {};

  async function run() {
    await sleep(900);
    const host = document.getElementById('fft-ui-host');
    const sr = host && host.shadowRoot;
    if (!sr) {
      out.error = 'no ui';
      finish();
      return;
    }
    const fab = sr.getElementById('fft-fab');
    const panel = sr.getElementById('fft-panel');
    const before = fab.getBoundingClientRect();
    out.initial = { left: Math.round(before.left), top: Math.round(before.top) };

    fab.click();
    await sleep(120);
    out.clickOpens = !panel.hidden;
    sr.getElementById('fft-close').click();
    await sleep(120);

    const startX = before.left + 24;
    const startY = before.top + 24;
    const targetX = Math.max(40, startX - 180);
    const targetY = Math.max(40, startY - 120);
    const base = { bubbles: true, pointerId: 7, isPrimary: true, button: 0 };
    fab.dispatchEvent(new PointerEvent('pointerdown', Object.assign({}, base, { clientX: startX, clientY: startY, buttons: 1 })));
    fab.dispatchEvent(new PointerEvent('pointermove', Object.assign({}, base, { clientX: targetX, clientY: targetY, buttons: 1 })));
    fab.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, base, { clientX: targetX, clientY: targetY, buttons: 0 })));
    await sleep(120);

    const after = fab.getBoundingClientRect();
    out.moved = {
      left: Math.round(after.left),
      top: Math.round(after.top),
      dx: Math.round(after.left - before.left),
      dy: Math.round(after.top - before.top)
    };
    try {
      out.saved = JSON.parse(localStorage.getItem('fft-settings-v1')).fabPos;
    } catch (err) {
      out.saved = null;
    }

    // 拖拽结束后的 click 应被抑制；等抑制窗口过去再打开面板。
    await sleep(500);
    fab.click();
    await sleep(150);
    const panelRect = panel.getBoundingClientRect();
    out.panel = {
      hidden: panel.hidden,
      left: panel.style.left,
      top: panel.style.top,
      right: panel.style.right,
      bottom: panel.style.bottom,
      rect: { left: Math.round(panelRect.left), top: Math.round(panelRect.top), right: Math.round(panelRect.right), bottom: Math.round(panelRect.bottom) },
      inViewport: panelRect.left >= 0 && panelRect.top >= 0 && panelRect.right <= innerWidth && panelRect.bottom <= innerHeight
    };

    sr.getElementById('fft-reset-pos').click();
    await sleep(180);
    const defaultGap = innerWidth <= 540 ? 14 : 22;
    const resetLeft = parseFloat(fab.style.left) || 0;
    const resetTop = parseFloat(fab.style.top) || 0;
    out.reset = {
      defaultGap: defaultGap,
      rightGap: Math.round(innerWidth - (resetLeft + 48)),
      bottomGap: Math.round(innerHeight - (resetTop + 48)),
      left: Math.round(resetLeft),
      top: Math.round(resetTop),
      fabHidden: fab.hidden
    };
    try {
      const saved = JSON.parse(localStorage.getItem('fft-settings-v1'));
      out.reset.saved = saved.fabPos;
    } catch (err) {
      out.reset.saved = null;
    }

    out.pass = {
      clickOpens: out.clickOpens,
      moved: Math.abs((after.left - before.left) + 180) <= 2 && Math.abs((after.top - before.top) + 120) <= 2,
      saved: out.saved && Math.abs(out.saved.x - after.left) <= 2 && Math.abs(out.saved.y - after.top) <= 2,
      panelOpen: !panel.hidden,
      panelAnchored: panel.style.left !== '' && panel.style.top !== '' && panel.style.right === 'auto' && panel.style.bottom === 'auto',
      panelInViewport: out.panel.inViewport,
      reset: Math.abs(out.reset.rightGap - defaultGap) <= 2 && Math.abs(out.reset.bottomGap - defaultGap) <= 2 && out.reset.saved === null
    };
    finish();
  }

  function finish() {
    const pre = document.createElement('pre');
    pre.id = 'drag-results';
    pre.style.display = 'none';
    pre.textContent = 'DRAG_RESULT' + JSON.stringify(out) + 'DRAG_END';
    document.body.appendChild(pre);
  }

  run().catch((err) => {
    out.error = String(err && err.stack || err);
    finish();
  });
})();
