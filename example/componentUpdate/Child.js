import { h } from '../../lib/guid-mini-vue.esm.js';

export default {
  name: 'Child',
  setup(props) {
    console.log(props);
  },
  render(proxy) {
    return h('div', {}, [h('div', {}, 'child-props-msg：' + this.$props.msg)]);
  },
};
