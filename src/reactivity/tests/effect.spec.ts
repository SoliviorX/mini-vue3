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

  /**
   * 1. 调用effect(fn)后会返回一个function （runner）
   * 2. 调用runner后，会执行effect的回调函数fn，并获得fn的返回值
   */
  it('should return runner when call effect', () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return 'foo';
    });

    expect(foo).toBe(11);
    const r = runner();
    // 验证执行runner后，fn有没有再次执行
    expect(foo).toBe(12);
    // 验证执行runner有没有获取到fn的返回值
    expect(r).toBe('foo');
  });
});
