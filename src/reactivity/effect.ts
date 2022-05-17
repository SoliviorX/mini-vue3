/**
 * 创建effect时，首次会自动执行fn
 * 所以可以考虑使用class的方式实现effect
 */

class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
