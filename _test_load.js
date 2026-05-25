// Minimal browser mock to test JS loading
global.document = {
  readyState: 'loading',
  addEventListener: () => {},
  getElementById: () => null,
  querySelectorAll: () => ({ forEach: () => {}, length: 0 }),
  createElement: () => ({ textContent: '', innerHTML: '' }),
  querySelector: () => null,
  classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
};
global.window = {
  addEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  location: { reload: () => {} },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.navigator = {
  serviceWorker: { register: () => Promise.resolve({}), addEventListener: () => {} },
  userAgent: 'test',
  maxTouchPoints: 0,
  platform: '',
};
global.setTimeout = () => {};
global.clearTimeout = () => {};
global.requestAnimationFrame = () => {};
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.Blob = function() {};
global.FileReader = function() { this.onload = null; this.readAsText = () => {} };
global.fetch = () => Promise.resolve();

try {
  console.log('Loading JS...');
  require('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js');
  console.log('JS loaded OK');
} catch(e) {
  console.log('JS ERROR:', e.message);
  console.log('Stack:', (e.stack || '').substring(0, 500));
}