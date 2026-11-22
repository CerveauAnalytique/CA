const { chromium } = require('playwright');
exports.launch = async (extra = {}) => {
  const b = await chromium.launch({ proxy: { server: 'http://127.0.0.1:9', bypass: 'cloud.ca7.io,localhost,127.0.0.1' }, args: ['--host-resolver-rules=MAP cloud.ca7.io 127.0.0.1','--no-proxy-server'] });
  const c = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true, ...extra });
  await c.addInitScript(() => {
    Object.defineProperty(window, 'devicePixelRatio', { get: () => 2 });
    Object.defineProperty(window, 'innerWidth', { get: () => 540 });
    Object.defineProperty(window, 'innerHeight', { get: () => 960 });
    const vv = { width: 540, height: 960, offsetLeft: 0, offsetTop: 0, pageLeft: 0, pageTop: 0, scale: 1, addEventListener() {}, removeEventListener() {} };
    Object.defineProperty(window, 'visualViewport', { get: () => vv });
    const st = document.createElement('style');
    st.textContent = 'html{transform:scale(2);transform-origin:0 0;width:540px!important;height:960px!important;overflow:hidden!important}body{width:540px;height:960px;margin:0}@keyframes ca7tap{0%{transform:translate(-50%,-50%) scale(.3);opacity:.9}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}.ca7tap{position:fixed;width:34px;height:34px;border-radius:50%;background:rgba(37,99,235,.35);border:2px solid #2563eb;z-index:2147483647;pointer-events:none;animation:ca7tap .7s ease-out forwards}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(st));
  });
  const p = await c.newPage();
  // logical coordinates (540 x 960)
  p.tap = async (x, y, wait = 700) => {
    await p.evaluate(([x, y]) => { const d = document.createElement('div'); d.className = 'ca7tap'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.documentElement.appendChild(d); setTimeout(() => d.remove(), 900); }, [x, y]);
    await p.waitForTimeout(150);
    await p.mouse.click(x * 2, y * 2);
    await p.waitForTimeout(wait);
  };
  p.type = async (text, delay = 55) => { await p.keyboard.type(text, { delay }); };
  p.scroll = async (dy, steps = 6, gap = 90) => { for (let i = 0; i < steps; i++) { await p.mouse.move(540, 960); await p.mouse.wheel(0, (dy / steps) * 2); await p.waitForTimeout(gap); } };
  p.shot = (n) => p.screenshot({ path: n });
  return { b, c, p };
};
