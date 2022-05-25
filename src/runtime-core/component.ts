import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initProps } from './componentProps';
import { shallowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initSlots } from './componentSlots';

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: () => {},
  };
  // 使用bind将component实例作为第一个参数传给emit，用于在emit中获取props对应的事件，所以用户只需要传入事件名及其他参数即可
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);

  initSlots(instance, instance.vnode.children);

  // setupStatefulComponent —— 初始化一个有状态的component；与其相对的是没有状态的函数式组件
  setupStatefulComponent(instance);

  // TODO 函数式组件的初始化
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    // 执行setup时，对currentInstance进行赋值
    setCurrentInstance(instance);
    // 将props、emit作为参数传给setup
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
    // 执行完setup后，清空currentInstance
    setCurrentInstance(null);
    // 处理setup的执行结果
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // setupResult is function or object
  // TODO function type

  // 如果setupResult是object类型，将setupResult放到组件实例上
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult;
  }

  // 处理组件的render函数
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  instance.render = Component.render;
}

let currentInstance = null;
export function getCurrentInstance() {
  return currentInstance;
}

// 使用函数包裹currentInstance的赋值：1. 方便调试 2. 代码可读性更高
export function setCurrentInstance(instance) {
  currentInstance = instance;
}
