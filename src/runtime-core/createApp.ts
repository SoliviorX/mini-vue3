import { render } from './render';
import { createVNode } from './vnode';

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      /**
       * 先转化成vnode，然后所有的逻辑操作都基于 vnode 做处理
       */
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer);
    },
  };
}
