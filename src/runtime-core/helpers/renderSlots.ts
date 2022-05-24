import { createVNode } from '../vnode';

/**
 * 1. 当slots是一个数组时，在子组件中接收this.$slots需要进行处理：h('div', {}, [garandSon, this.$slots])，组件的children不能是嵌套数组，所以需要对this.$slots进行处理。
 * 2. 把this.$slots展开放入children中也行啊，还可以少一层div包裹，为何不这样处理？？？？
 */
export function renderSlots(slots, name, props) {
  // 通过 name 获取创建相应插槽的方法
  const slot = slots[name];
  if (slot) {
    if (typeof slot === 'function') {
      return createVNode('div', {}, slot(props));
    }
  }
}
