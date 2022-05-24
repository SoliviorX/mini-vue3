import { ShapeFlags } from '../shared/shapeFlags';

export const initSlots = (instance, children) => {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
};

// 遍历 children，将其 property 对应的 VNode 数组挂载到 slots 对象上
function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    if (typeof value === 'function') {
      slots[key] = props => normalizeSlotValue(value(props));
    }
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
