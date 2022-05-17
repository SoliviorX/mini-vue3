/**
 * 创建effect时，首次会自动执行fn
 * 所以可以考虑使用class的方式实现effect
 */
class ReactiveEffect {
  private _fn: any;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    // 实例化的时候，将activeEffect赋值为当前实例
    activeEffect = this;
    // 将fn的返回值return出去
    return this._fn();
  }
}

// 依赖收集；每个key对应一个独一无二的dep，在dep中收集activeEffect
const targetMap = new Map();
/**
 * targetMap的结构及对应的类型和名称：
 * targetMap<Map> {
        target1<Map> : depsMap-{
            key1<Set>: dep-[activeEffect],
            key2<Set>: dep-[activeEffect],
        },
        target2<Map> : depsMap-{
            key1<Set>: dep-[activeEffect]
        },
    }
*/
export function track(target, key) {
  // target -> key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  dep.add(activeEffect);
}

// 触发更新：获取到dep收集的所有effect，执行effect里面的回调
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect;
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  // 返回runner，并将指针绑定为effect实例
  const runner = _effect.run.bind(_effect);
  return runner;
}
