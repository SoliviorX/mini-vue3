import { reactive } from '../reactive';
import { effect, stop } from '../effect';

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

  /**
   * 1. 通过effect的第二个参数，给定一个scheduler的fn
   * 2. effect第一次执行时还会执行fn
   * 3. 当响应式对象的set更新时，不再执行fn，而是执行scheduler
   * 4. 如果手动执行runner，会再次执行fn
   */
  it('scheduler', () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler },
    );
    // 验证scheduler第一时间没有被调用
    expect(scheduler).not.toHaveBeenCalled();

    // 验证effect的第一个回调函数第一时间被调用了
    expect(dummy).toBe(1);
    obj.foo++;

    // 验证响应式数据修改后，scheduler会被调用一次，而effect的第一个参数不会被调用
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);

    // 验证手动执行runner，fn会被执行
    run(); // scheduler执行后，run被赋值为runner，即_effect.run
    expect(dummy).toBe(2);
  });

  it('stop', () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    // 调用 stop 后，当传入的函数依赖的响应式对象的 property 的值更新时不会再执行该函数
    stop(runner);
    obj.prop = 3;
    /**
     * obj.prop++;  下面的expect报错，dummy === 3，fn会被执行，stop失效，与obj.prop = 3有何不同？？？？
     */
    expect(dummy).toBe(2);
    // 只有手动调用`runner`时才会触发fn执行
    runner();
    expect(dummy).toBe(3);
  });

  /**
   * 1. 通过第二个参数给effect传递一个函数——onStop
   * 2. 用户调用stop(runner)后，onStop会被执行一次
   */
  it('onStop', () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      },
    );
    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
