interface VNode {
  /* html标签名、有状态组件的配置、函数式组件 */
  type: string | object | Function;
  /* 组件/元素的attributes、prop、事件 */
  props?: object;
  /* 子代VNode、文本 */
  children?: string | Array<VNode> | object;
}

export function createVNode(type, props?, children?) {
  const vnode: VNode = {
    type,
    props,
    children,
  };

  return vnode;
}
