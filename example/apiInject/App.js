import { h, provide, inject } from '../../lib/guid-mini-vue.esm.js';

// 第一层
const Provider_I = {
  name: 'Provider_I',
  setup() {
    provide('foo', 'fooValI');
    provide('bar', 'barValI');
  },
  render() {
    return h('div', {}, [h('p', {}, 'Provider_I'), h(Provider_II)]);
  },
};

// 第二层
const Provider_II = {
  name: 'Provider_II',
  setup() {
    provide('foo', 'fooValII');
  },
  render() {
    return h('div', {}, [h('p', {}, 'Provider_II'), h(Consumer)]);
  },
};

// 第三层
const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo'); // => fooValII，获取最近的祖先组件注入的依赖
    const bar = inject('bar'); // => barValI

    // inject 支持传入默认值
    const baz1 = inject('baz', 'defaultBaz1'); // => defaultBaz1
    const baz2 = inject('baz', () => 'defaultBaz2'); // => defaultBaz2

    return {
      foo,
      bar,
      baz1,
      baz2,
    };
  },
  render() {
    return h('p', {}, `Consumer: - ${this.foo} - ${this.bar}- ${this.baz1}- ${this.baz2}`);
  },
};

export default {
  name: 'App',
  setup() {},
  render() {
    return h('div', {}, [h('p', {}, 'apiInject'), h(Provider_I)]);
  },
};
