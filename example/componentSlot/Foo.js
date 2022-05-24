import { h, renderSlots } from '../../lib/guid-mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  render() {
    const foo = h('p', {}, 'foo');
    // 1. 基础版插槽
    // 如果this.$slots是一个数组，使用展开符展开也行，为什么需要使用renderSlots进行处理？？？？？？
    // return h('div', {}, [foo, renderSlots(this.$slots)])

    // 2. 具名插槽
    // return h('div', {}, [
    //   renderSlots(this.$slots, 'header'),
    //   foo,
    //   renderSlots(this.$slots, 'footer'),
    // ]);

    // 3. 作用域插槽
    const msg = 'this is a slot';
    return h('div', {}, this.$slots.content({ msg }));
  },
  setup() {
    return {};
  },
};
