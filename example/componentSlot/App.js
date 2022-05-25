import { h, createTextVNode } from '../../lib/guid-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  render() {
    const app = h('div', {}, 'App');
    // 目标：让插槽内容能够在Foo组件中展示出来
    // 1. 传入一个vnode作为插槽
    // const foo = h(
    //   Foo,
    //   {},
    //   {
    //     default: [h('p', {}, '123')],
    //   },
    // );
    // 2. 传入一个vnode数组，数组中每一项都是一个插槽
    // const foo = h(
    //   Foo,
    //   {},
    //   {
    //     default: [h('p', {}, 'a slot'), h('p', {}, 'another slot')],
    //   },
    // );
    // 3. 具名插槽，object的形式传入slots
    const foo = h(
      Foo,
      {},
      {
        header: [h('p', {}, 'header'), createTextVNode('a prograph')],
        footer: h('p', {}, 'footer'),
      },
    );
    // 4. 作用域插槽：传入一个对象，对象中的每个方法为一个创建插槽的函数
    // const foo = h(
    //   Foo,
    //   {},
    //   {
    //     content: props => h('p', {}, 'content:' + props.msg),
    //   },
    // );
    return h('div', {}, [app, foo]);
  },
  setup() {
    return {};
  },
};
