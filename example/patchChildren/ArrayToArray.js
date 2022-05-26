import { ref, h } from '../../lib/guid-mini-vue.esm.js';

// 1. 左侧的对比：(A B) C => (A B) D E
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'E' }, 'E'),
// ];

// 2. 右侧的对比：A (B C) => D E (B C)
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ];

// 3. 新的比老的多
// 3.1 长的部分位于右侧，从左侧开始对比：(A B) => (A B) C D
// 对比完后，i=2，e1=1，e2=3；
// 即当 i > e1 && i<=e2 时，满足该条件
// const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')];
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
// ];
// 3.2 长的部分位于左侧，从右侧开始对比：(A B) => D C (A B)
// 对比完后 i=0，e1=-1，e2=1
// 也是当 i > e1 && i<=e2 时，满足该条件
// const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')];
// const nextChildren = [
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
// ];

// 4. 老的比新的多
// 4.1 多出的部分在右侧：(A B) C D => (A B)
// 比较完 i=2，e1=3，e2=1，满足i>e2 && i<=e1
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
// ];
// const nextChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')];
// 4.2 多出的部分在左侧：A B (C D) => (C D)
// 比较完 i=0，e1=1，e2=-1，满足i>e2 && i<=e1
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
// ];
// const nextChildren = [h('p', { key: 'C' }, 'C'), h('p', { key: 'D' }, 'D')];

// 5. 对比中间的部分
// 5.1 a,b,(c,d),f,g => a,b,(e,c),f,g 删除oldChildren中的d，更新c，创建e
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C', id: 'c-prev' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'H' }, 'H'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
];
const nextChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'C', id: 'c-next' }, 'C'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
];

export const ArrayToArray = {
  name: 'ArrayToArray',
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
