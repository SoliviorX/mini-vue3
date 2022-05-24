import { h } from '../../lib/guid-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  render() {
    return h('div', {}, [
      h('div', {}, 'App'),
      h(Foo, {
        onAddFoo(a, b) {
          console.log('onAdd', a, b);
        },
      }),
    ]);
  },
  setup() {
    return {};
  },
};
