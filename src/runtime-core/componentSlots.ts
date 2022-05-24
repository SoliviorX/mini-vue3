import { ShapeFlags } from '../shared/shapeFlags';

export const initSlots = (instance, children) => {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
};

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}

// 遍历 children，将其 property 对应的 VNode 数组挂载到 slots 对象上
function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    if (typeof value === 'function') {
      // 如果是作用域插槽
      slots[key] = props => normalizeSlotValue(value(props));
    } else {
      // 如果是具名插槽/默认插槽（key是default）
      slots[key] = normalizeSlotValue(value);
    }
  }
}
