import { ref, h } from '../../lib/guid-mini-vue.esm.js';
const nextChildren = 'newChild';
const prevChildren = 'oldChild';

export const TextToText = {
  name: 'TextToText',
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
