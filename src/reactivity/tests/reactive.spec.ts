import { reactive, isReactive } from '../reactive';

describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);
    // 测试reactive(original)数据是否是isReactive
    expect(isReactive(observed)).toBe(true);
    // 测试原始数据original是否是isReactive
    expect(isReactive(original)).toBe(false);
  });
});
