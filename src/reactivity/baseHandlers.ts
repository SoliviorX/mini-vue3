import { track, trigger } from './effect';
import { reactive, ReactiveFlags, readonly } from './reactive';
import { extend, isObject } from '../shared/index';

function createGetter(isReadonly = false, shallow = false) {
  return function (target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    // 如果是shallow类型，直接return，不进行后续的递归readonly处理以及依赖收集
    if (shallow) {
      return res;
    }

    // 【深层属性的处理】**************
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    // isReadonly属性不进行依赖收集
    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function (target, key, value) {
    const res = Reflect.set(target, key, value);
    // 触发依赖更新
    trigger(target, key);
    return res;
  };
}

// 优化：将创建getter、setter缓存起来，而不是每次调用reactive/readonly都创建新的getter函数/setter函数
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key:${key} set 失败，因为 ${target} 是readonly。`);
    return true;
  },
};

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
