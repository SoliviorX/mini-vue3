import { createRenderer } from '../runtime-core/index';
function createElement(type) {
  return document.createElement(type);
}
function patchProp(el, key, preVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // 处理事件
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    // 处理普通属性
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
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
