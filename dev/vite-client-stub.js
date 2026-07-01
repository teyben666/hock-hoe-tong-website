/**
 * 开发时 DISABLE_HMR=true：提供 Vite 注入代码所需的导出，但不连 WebSocket。
 */

const sheetsMap = new Map();
let lastInsertedStyle;

export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    const nonce = document.querySelector('meta[property=csp-nonce]')?.nonce;
    if (nonce) style.setAttribute('nonce', nonce);
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = undefined;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}

const noop = () => {};

export function createHotContext() {
  return {
    accept: noop,
    acceptDeps: noop,
    decline: noop,
    dispose: noop,
    prune: noop,
    invalidate: noop,
    on: () => noop,
    off: noop,
    send: noop,
    data: {},
  };
}

export function injectQuery(url) {
  return url;
}

export class ErrorOverlay {}
