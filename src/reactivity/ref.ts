import { trackEffects, triggerEffects, isTracking } from './effect';
import { hasChanged, isObject } from '../shared/index';
import { reactive } from './reactive';

// implement：实现
class RefImpl {
  private _value: any;
  private _rawValue: any;
  public dep;
  public __v_isRef = true;
  constructor(value) {
    /**
     * 1. 取值的时候判断value是否是对象，是对象的话就用reactive进行包裹，否则直接取值
     * 2. 将原始值存起来，方便后边修改的时候对比新旧值
     */
    this._rawValue = value;
    this._value = convert(value);
    // Set 类型保证dep不会重复收集依赖
    this.dep = new Set();
  }

  // 所有ref的数据都是通过value属性获取到它的值，所以都会走到get value()这一步；在get中进行依赖收集。
  // reactive依赖收集时会创建targetMap，targetMap中每个target对应一个depsMap，depsMap中每个key对应一个dep；
  // ref只有一个key（就是value属性），只在实例化RefImpl时，才会往实例上添加一个dep来收集依赖。
  get value() {
    if (isTracking()) {
      trackEffects(this.dep);
    }
    return this._value;
  }
  set value(newValue) {
    /**
     * 1. 新、旧值相同直接return
     * 2. 对比的时候，比较的时原始值，而不是proxy
     * 3. 要先修改value的值，再去通知更新
     */
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(val) {
  return isRef(val) ? val.value : val;
}
