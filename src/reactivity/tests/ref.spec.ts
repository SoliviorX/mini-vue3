import { effect } from '../effect';
import { ref } from '../ref';

describe('ref', () => {
  // 测试 经过ref处理过的数据，需要通过value属性拿到它的值
  it('happy path', () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  // 测试响应式
  it('should be reactive', () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    // 经过ref处理的a发生改变，也会触发相关effect.run()，和reactive类似，有一个依赖收集-触发更新的过程
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  // 测试深层属性的响应式
  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });
});
