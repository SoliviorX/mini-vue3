import { reactive } from '../reactive';
import { computed } from '../computed';

describe('computed', () => {
  it('happy path', () => {
    const user = reactive({
      age: 1,
    });
    const age = computed(() => {
      return user.age;
    });
    expect(age.value).toBe(1);
  });

  it('should computed lazily', () => {
    const value = reactive({
      foo: 1,
    });
    const getter = jest.fn(() => {
      return value.foo;
    });
    const cValue = computed(getter);

    // 1. 首次获取cValue.value时，getter会被调用一次
    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // 2. 再次获取cValue.value时，getter不会被调用
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // 3. 响应式依赖项更新后，不立即触发computed 的 getter
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // 4. 手动读取计算属性时（由于之前修改了依赖项，在scheduler中将dirty改为了true），会重新执行getter
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // 5. 再次读取计算属性时，getter不会被重新执行，因为dirty又被设为了false
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
