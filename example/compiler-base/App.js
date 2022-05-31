import { ref } from '../../lib/guid-mini-vue.esm.js';

export const App = {
  name: 'App',
  template: `<div>hello,{{count}}</div>`,
  setup() {
    const count = (window.count = ref(1));
    return {
      count,
    };
  },
};
