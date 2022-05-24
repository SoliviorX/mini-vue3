import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initProps } from './componentProps';
import { shallowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmit';

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  };
  // 使用bind将component实例作为第一个参数传给emit，用于在emit中获取props对应的事件，所以用户只需要传入事件名及其他参数即可
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  // TODO:
  // initSlots()

  // setupStatefulComponent —— 初始化一个有状态的component；与其相对的是没有状态的函数式组件
  setupStatefulComponent(instance);

  // TODO 函数式组件的初始化
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    // 将props、emit作为参数传给setup
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });

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
