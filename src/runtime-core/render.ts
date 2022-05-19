import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // TODO 根据虚拟节点类型进行不同的处理逻辑

  // 处理组件
  processComponent(vnode, container);

  // TODO 处理元素：processElement
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
  const subTree = instance.render();

  // 递归调用子VNode
  patch(subTree, container);
}
