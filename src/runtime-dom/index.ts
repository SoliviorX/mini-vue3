import { createRenderer } from '../runtime-core/index';
function createElement(type) {
  return document.createElement(type);
}
function patchProp(el, key, val) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // 处理事件
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    // 处理普通属性
    el.setAttribute(key, val);
  }
}
function insert(el, container) {
  container.append(el);
}

function createText(text) {
  return document.createTextNode(text);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  createText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from '../runtime-core/index';
