import { createRenderer } from '../runtime-core/index';
// 创建元素节点
function createElement(type) {
  return document.createElement(type);
}
// 设置props
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
// 将节点插入container容器中
function insert(el, container) {
  container.append(el);
}
// 创建文本节点
function createText(text) {
  return document.createTextNode(text);
}
// 删除节点
function remove(el) {
  const parent = el.parentNode;
  if (parent) {
    parent.removeChild(el);
  }
}
// 设置节点的text
function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  createText,
  remove,
  setElementText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from '../runtime-core/index';
