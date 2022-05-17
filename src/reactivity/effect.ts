import { extend } from '../shared/index';

let activeEffect;
let shouldTrack;

/**
 * 创建effect时，首次会自动执行fn
 * 所以可以考虑使用class的方式实现effect
 */
class ReactiveEffect {
  private _fn: any;
  deps = [];
  active: boolean = true;
  onStop?: () => void;
  public scheduler: Function | undefined;
  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    if (!this.active) {
      return this._fn();
    }
    /**
     * 1. 先把shouldTrack设为true，当执行下面的_fn时，就会进行依赖收集，fn执行完再把shouldTrack设为false
     * 2. 只有在初始化effect实例、触发更新和手动执行runner时才会执行 run()
     * 3. 也就是说在重新获取数据，触发数据的get时，不会执行run，shouldTrack为false，不会重新进行依赖收集
     * 4. 所以当执行obj.foo++ 重新触发get时，由于shouldTrack为false，不会重新进行依赖收集
     */
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    // reset
    shouldTrack = false;

    return result;
  }
  stop() {
    // 某effect的stop执行过后，不再重复执行，优化性能
    if (this.active) {
      // 在所有的dep中删除该effect
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect) {
  // deps中每个dep都把该effect删除
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  // 再把该effect.deps清空
  effect.deps.length = 0;
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
  if (!isTracking()) return;

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

  // 不重复收集
  if (dep.has(activeEffect)) return;

  dep.add(activeEffect);
  // 反向收集
  activeEffect.deps.push(dep);
}
function isTracking() {
  return shouldTrack && activeEffect !== undefined;
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

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // 方式一：_effect.onStop = options.onStop
  // 方式二：Object.assign(_effect, options);
  // 方式三：export extend = Object.assign，然后使用extend来扩展_effect，更具可读性。
  extend(_effect, options);

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
