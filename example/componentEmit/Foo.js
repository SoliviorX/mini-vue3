import { h } from '../../lib/guid-mini-vue.esm.js';

export const Foo = {
  setup(props, { emit }) {
    // 为什么不直接通过props.onAddFoo(3, 4)的方式调用，而是通过emit调用？
    props.onAddFoo(3, 4);
    console.log(props.onAddFoo);
    const emitAdd = () => {
      console.log('emit add');
      emit('add-foo', 1, 2);
    };
    return {
      emitAdd,
    };
  },
  render() {
    const btn = h(
      'button',
      {
        onClick: this.emitAdd,
      },
      'emitAdd',
    );
    const foo = h('p', {}, 'foo');
    return h('div', {}, [foo, btn]);
  },
};
