import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';

// 通过枚举定义参数
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

function createReactiveObject(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}

export function isReactive(value) {
  /**
   * 1. 如果value通过proxy进行过代理，则会触发数据的get，可以通过isReadonly来进行判断
   * 2. 如果value没有通过proxy代理，只是普通的数据，则会返回undefined，只需将它转化为布尔值即可
   */
  //
  // 对于proxy代理过的value，value[ReactiveFlags.IS_REACTIVE] 返回的就是 !isReadonly
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}
