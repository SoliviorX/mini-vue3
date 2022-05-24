import { h, renderSlots } from '../../lib/guid-mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  render() {
    const foo = h('p', {}, 'foo');
    // 1. 默认插槽
    // return h('div', {}, [foo, renderSlots(this.$slots, 'default')]);
    // 2. 具名插槽
    // return h('div', {}, [
    //   renderSlots(this.$slots, 'header'),
    //   foo,
    //   renderSlots(this.$slots, 'footer'),
    // ]);
    // 3. 作用域插槽
    const msg = 'this is a slot';
    return h('div', {}, renderSlots(this.$slots, 'content', { msg }));
  },
  setup() {
    return {};
  },
};
