import { ReactiveEffect } from './effect';

class ComputedRefImpl {
  private _getter: any;
  private _dirty: boolean = true;
  private _value: any;
  private _effect: any;
  constructor(getter) {
    this._getter = getter;
    // 利用scheduler实现computed effect：当依赖项发生改变时，不会触发fn，而是触发scheduler
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }
  /**
   * 1. computed 属性也是通过value获取
   * 2. 当依赖的响应式对象的值发生改变时，将dirty变为true，那么下次取计算属性的值，触发get时就会重新计算
   */
  get value() {
    if (this._dirty) {
      this._dirty = false;
      // 执行this._effect.run()，则getter中响应式的依赖项会收集当前computed对应的effect实例
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
