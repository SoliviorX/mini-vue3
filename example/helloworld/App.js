import { h } from '../../lib/guid-mini-vue.esm.js';
import { Foo } from './Foo.js';
window.self = null;

export const App = {
  name: 'App',
  // template也会被编译成render函数
  render() {
    window.self = this;
    // 测试在render函数中通过this获取到setup的返回对象的property
    return h(
      'div',
      {
        id: 'app',
        class: ['red', 'blue'],
        // 注册 onClick 事件
        onClick() {
          console.log('you clicked root-div');
        },
        // 注册 onMousedown 事件
        onMousedown() {
          console.log('your mouse down on root-div');
        },
      },
      [h('div', {}, 'hi,' + this.msg), h(Foo, { count: 1 })],
      // 'hi,' + this.msg, // string文本
      // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue-next')],
    );
  },
  setup() {
    // 可以返回一个对象或函数，如果是函数则表示返回的是render函数
    return {
      msg: 'mini-vue-next',
    };
  },
};
