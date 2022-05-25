import { h, ref } from '../../lib/guid-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {
    const count = ref(0);
    const props = ref({
      foo: 'foo',
      bar: 'bar',
    });
    const onClick = () => {
      count.value++;
      console.log(count.value);
    };
    const onChangePropsDemo1 = () => {
      props.value.foo = 'new-foo';
    };
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: 'foo',
      };
    };
    return {
      count,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      props,
    };
  },
  render() {
    // 由于在元素属性中使用了props，所以修改props会触发更新
    return h('div', { id: 'App', ...this.props }, [
      h('div', {}, 'count:' + this.count),
      h('button', { onClick: this.onClick }, 'click'),
      h('button', { onClick: this.onChangePropsDemo1 }, 'changeProps-值改变了-修改'),
      h('button', { onClick: this.onChangePropsDemo2 }, 'changeProps-值变成了undefined-删除'),
      h('button', { onClick: this.onChangePropsDemo3 }, 'changeProps-key在新的里面没有了-修改'),
    ]);
  },
};
