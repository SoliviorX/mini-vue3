/**
 * mini-vue-next 的出口，rollup的入口
 */
export * from './runtime-dom/index'; // 在runtime-dom/index 中导出了 runtime-core

import * as runtimeDom from './runtime-dom';
import { baseCompile } from './compiler-core/src/index';
import { registerRuntimeCompiler } from './runtime-dom';

function compileToFunction(template) {
  const { code } = baseCompile(template);
  /**
   * code的格式：
   * `
        "const { toDisplayString:_toDisplayString, createElementVNode:_createElementVNode } = Vue
        return function render(_ctx, _cache){return _createElementVNode('div', null, 'hello, ' + _toDisplayString(_ctx.message))}"
    `
   */
  // new Function将字符串转化成函数，语法：new Function([arg1[, arg2[, ...argN]],] functionBody)
  // 使用 new Function 创建一个函数，那么该函数的 [[Environment]] 并不指向当前的词法环境，而是指向全局环境。
  const render = new Function('Vue', code)(runtimeDom);
  /**
   * 创建的函数为：
   * function(Vue = runtimeDom) {
   *    const { toDisplayString:_toDisplayString, createElementVNode:_createElementVNode } = Vue
        return function render(_ctx, _cache){return _createElementVNode('div', null, 'hello, ' + _toDisplayString(_ctx.message))}
   * }
        // 1. _ctx未知，需要在调用render的时候传入，也就是在renderer.ts里的setupRenderEffect中调用render时，绑定this后再将proxy传给render函数。
        // 2. toDisplayString 和 createElementVNode还没实现，由于Vue的默认值是runtimeDom，也就是需要在 runtime-dom 中实现这两个方法
   */
  return render;
}

registerRuntimeCompiler(compileToFunction);
