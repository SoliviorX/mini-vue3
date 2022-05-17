import { reactive } from '../reactive';
import { effect } from '../effect';

/**
 * 测试reactive：
 * 1. 用reactive创建一个响应式对象
 * 2. 用effect包裹一个回调函数
 * 3. 当响应式对象数据发生变化，相关effect的回调函数再次执行
 */
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    });

    // 1. 调用effect时，回调函数会自动执行
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // 2. 当响应式对象数据发生变化，相关effect的回调函数再次执行
    user.age++;
    expect(nextAge).toBe(12);
  });
});
