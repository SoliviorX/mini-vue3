import { ShapeFlags } from '../shared/index';

export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text');

interface VNode {
  /* html标签名、有状态组件的配置、函数式组件 */
  type: string | object | Function;
  /* 组件/元素的attributes、prop、事件 */
  props?: object;
  /* 子代VNode、文本 */
  children?: string | Array<VNode> | object;
  /* 真实el */
  el?;
  /* 元素的key */
  key?;
  // vnode的类型（元素或组件），children的类型（string或array）
  shapeFlag?;
}

export function createVNode(type, props?, children?) {
  const vnode: VNode = {
    type,
    props,
    children,
    el: null,
    key: props && props.key,
    shapeFlag: getShapeFlag(type),
  };

  // 用 或运算符 进行shapeFlag的合并，来设置children类型
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // 如果vnode类型是component，同时children类型为对象，则children为插槽，设置shapeFlag 对应的位
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
  return vnode;
}

// 根据vnode.type设置初始的vnode.shapeFlag
function getShapeFlag(type) {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}
