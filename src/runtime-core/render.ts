import { isObject } from '../shared/index';
import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  if (typeof vnode.type === 'string') {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  // 元素初始化
  mountElement(vnode, container);

  // TODO 元素更新
}

function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);

  const { children, props } = vnode;
  if (Array.isArray(children)) {
    mountChildren(vnode, el);
  } else if (typeof children === 'string') {
    el.textContent = children;
  }

  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach(v => {
    patch(v, container);
  });
}

function processComponent(vnode: any, container: any) {
  // 组件初始化
  mountComponent(vnode, container);

  // TODO updateComponent
}

function mountComponent(vnode, container) {
  // 1. 创建组件实例
  const instance = createComponentInstance(vnode);
  // 2. 初始化组件属性：initProps、initSlots，调用setup、处理setup的返回值（当前仅处理返回类型为object）赋值到instance.setupState，将组件的render函数赋值到instance.render上
  setupComponent(instance);

  // 3. 执行render函数、递归patch，渲染组件
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
  // 执行render函数，生成vnode树
  console.log(instance);
  const subTree = instance.render();

  // 递归调用子VNode
  patch(subTree, container);
}
