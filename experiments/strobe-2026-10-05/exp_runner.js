/* exp_runner.js — 用最小浏览器桩在 Node 中原地运行 index.html 的确定性频闪实验
   用法: node exp_runner.js [seed] [days] [outFile] [cad] [trace]
   例:   node exp_runner.js 2ddf82ed 30 report.json 25,5
   cad:  逗号分隔的封存节奏（虚拟秒），默认 25,5；报告由引擎直接生成，无需事后加工
   引擎: ../../index.html（仓库根）；输出 runExp 生成的完整 JSON 报告到 outFile（默认 stdout）
   参考: report-30d.json 为用本脚本跑出的 30 天报告（25,5） */
const fs = require('fs'), vm = require('vm'), path = require('path');

const seed = process.argv[2] || '2ddf82ed';
const days = process.argv[3] || '2';
const outFile = process.argv[4] || null;
/* 第 5 参数为封存节奏（默认 25,5）；任何位置出现 trace 即开步级追踪 */
const cad = process.argv[5] && process.argv[5] !== 'trace' ? process.argv[5] : '25,5';

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('未找到内联 script'); process.exit(1); }
const code = m[1];

/* ---------- 浏览器桩 ---------- */
const noop = () => {};

function makeCtx2d() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return { width: 0, height: 0 };
      if (p === 'createImageData' || p === 'getImageData')
        return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient')
        return () => ({ addColorStop: noop });
      if (p === 'getContextAttributes') return () => ({});
      return typeof p === 'string' ? noop : undefined;
    },
    set: () => true
  });
}

const createdEls = [];
function makeEl(tag) {
  const el = {
    tag, id: '', style: {}, dataset: {}, attrs: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, insertBefore(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return makeEl('div'); },
    querySelectorAll() { return []; },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700, x: 0, y: 0 };
    },
    focus() {}, blur() {}, click() {},
    scrollTop: 0, scrollLeft: 0, scrollHeight: 0, scrollWidth: 0,
    clientWidth: 1000, clientHeight: 700, offsetWidth: 1000, offsetHeight: 700,
    innerHTML: '', textContent: '', value: '', width: 0, height: 0,
    getContext() { return makeCtx2d(); }
  };
  return el;
}

const documentStub = {
  documentElement: makeEl('html'),
  body: makeEl('body'),
  hidden: false, visibilityState: 'visible',
  readyState: 'complete',
  getElementById(id) { return makeEl(id); },
  createElement(tag) {
    const el = makeEl(tag);
    if (tag === 'canvas') { el.width = 300; el.height = 150; }
    createdEls.push(el);
    return el;
  },
  addEventListener() {}, removeEventListener() {},
  querySelector() { return makeEl('div'); },
  querySelectorAll() { return []; }
};

class StorageShim {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key(i) { return Array.from(this.m.keys())[i]; }
}

const traceOn = process.argv.includes('trace');
const search = `?exp=seal&seed=${seed}&days=${days}&cad=${cad}${traceOn ? '&trace=1' : ''}`;
let perfT0 = Date.now();
const sandbox = {
  document: documentStub,
  localStorage: new StorageShim(),
  location: { href: 'http://localhost/' + search, search },
  navigator: { userAgent: 'node-stub' },
  console,
  setTimeout:(fn)=>{ if(typeof fn==='function') queueMicrotask(fn); return 0; },
  clearTimeout:noop, setInterval: () => 0, clearInterval: noop,
  requestAnimationFrame: noop, cancelAnimationFrame: noop,
  performance: { now: () => Date.now() - perfT0 },
  confirm: () => false, alert: noop,
  URL, URLSearchParams, TextEncoder, TextDecoder, Blob: class { },
  Error, TypeError, RangeError, Math, JSON, Date, RegExp, Map, Set, WeakMap, WeakSet,
  Promise, Symbol, Proxy, Reflect, Array, Object, String, Number, Boolean,
  parseInt, parseFloat, isNaN, isFinite,
  Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int32Array,
  Infinity, NaN, undefined
};
sandbox.addEventListener = noop;
sandbox.removeEventListener = noop;
sandbox.Storage = StorageShim;
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
try {
  vm.runInContext(code, sandbox, { filename: 'index.html-script', displayErrors: true });
} catch (e) {
  console.error('脚本同步执行失败:', e);
  process.exit(1);
}

/* 等待 runExp 完成（异步），取回报告；超时按天数放宽（约 1 分钟/世界天） */
const started = Date.now();
const timeoutMs = Math.max(180000, parseInt(days, 10) * 90000);
const timer = setInterval(() => {
  const done = createdEls.find(e => e.dataset.done === '1');
  if (done) {
    clearInterval(timer);
    if (outFile) fs.writeFileSync(outFile, done.textContent, 'utf8');
    else process.stdout.write(done.textContent);
    process.exit(0);
  }
  if (Date.now() - started > timeoutMs) {
    clearInterval(timer);
    console.error('等待实验完成超时');
    process.exit(1);
  }
}, 20);
