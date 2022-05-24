import { h } from '../../lib/guid-mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  setup(props) {
    console.log(props);
  },
  render() {
    return h('div', {}, 'foo：' + this.count);
  },
};
