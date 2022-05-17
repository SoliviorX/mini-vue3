/**
 * 创建effect时，首次会自动执行fn
 * 所以可以考虑使用class的方式实现effect
 */
class ReactiveEffect {
  private _fn: any;
  deps = new Set();
  active: boolean = true;
  public scheduler: Function | undefined;
  constructor(fn, scheduler?) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 实例化的时候，将activeEffect赋值为当前实例
    activeEffect = this;
    // 将fn的返回值return出去
    return this._fn();
  }
  stop() {
    // 某effect的stop执行过后，不再重复执行，优化性能
    if (this.active) {
      // 在所有的dep中删除该effect
      cleanupEffect(this);
      this.active = false;
    }
  }
}
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
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
  // 反向收集
  activeEffect?.deps.add(dep);
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
  const runner: any = _effect.run.bind(_effect);
  // 在runner上新增一个effect属性，值为effect实例
  runner.effect = _effect;
  return runner;
}

// 实现思路：执行stop，将对应的effect从deps中删除
export function stop(runner) {
  runner.effect.stop();
}
