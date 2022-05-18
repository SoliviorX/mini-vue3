import { isReadonly, shallowReadonly } from '../reactive';

describe('shallowReadonly', () => {
  test('should not make non-reactive properties reactive', () => {
    const original = { n: { foo: 1 } };
    const props = shallowReadonly(original);
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });
  it('warn when call set', () => {
    console.warn = jest.fn();
    const user = shallowReadonly({
      age: 10,
    });
    user.age = 11;
    expect(console.warn).toBeCalled();
  });
});
