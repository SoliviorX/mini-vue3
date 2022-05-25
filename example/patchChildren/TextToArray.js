import { ref, h } from '../../lib/guid-mini-vue.esm.js';
const prevChildren = 'newChildren';
const nextChildren = [h('div', {}, 'A'), h('div', {}, 'B')];

export const TextToArray = {
  name: 'TextToArray',
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
  render() {
    const self = this;
    return self.isChange === true ? h('div', {}, nextChildren) : h('div', {}, prevChildren);
  },
};
