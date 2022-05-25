import { h, getCurrentInstance } from '../../lib/guid-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  setup() {
    const instance = getCurrentInstance();
    console.log('App:', instance);
  },
  render() {
    const app = h('p', {}, 'currentInstance demo');
    return h('div', {}, [app, h(Foo)]);
  },
};
