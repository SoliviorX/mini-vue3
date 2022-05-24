import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initProps } from './componentProps';
import { shallowReadonly } from '../reactivity/reactive';

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
  };
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
    // setup可以返回一个function或者object，返回function则表示返回的是render函数，返回对象则会把该对象中的数据注入到当前组件的上下文中
    // 将props作为参数传给setup
    const setupResult = setup(shallowReadonly(instance.props));

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
