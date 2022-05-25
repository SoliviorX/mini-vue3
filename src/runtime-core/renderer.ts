import { ShapeFlags } from '../shared/index';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { Fragment, Text } from './vnode';

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createText: hostCreateText,
  } = options;

  function render(vnode, container) {
    // render方法是在createApp中调用的，此时为根组件，parentComponent是null
    patch(vnode, container, null);
  }

  function patch(vnode, container, parentComponent) {
    const { type, shapeFlag } = vnode;

    switch (type) {
      // Fragment 只渲染 children
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 VNode 类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent);
  }

  function processText(vnode: any, container: any) {
    const { children } = vnode;
    const textNode = (vnode.el = hostCreateText(children));
    hostInsert(textNode, container);
  }

  function processElement(vnode: any, container: any, parentComponent) {
    // 元素初始化
    mountElement(vnode, container, parentComponent);

    // TODO 元素更新
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    // 将元素el存到vnode.el：访问this.$el时，即可从代理对象上访问instance.vnode.el
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;

    // 1. 处理children
    // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 children 类型
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果包含子节点
      mountChildren(vnode, el, parentComponent);
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果是文本节点
      hostInsert(children, el);
    }

    // 2. 处理props
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, val);
    }

    hostInsert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(v => {
      patch(v, container, parentComponent);
    });
  }

  function processComponent(vnode: any, container: any, parentComponent) {
    // 组件初始化
    mountComponent(vnode, container, parentComponent);

    // TODO updateComponent
  }

  function mountComponent(initialVNode, container, parentComponent) {
    // 1. 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);
    // 2. 初始化组件属性：initProps、initSlots，调用setup、处理setup的返回值（当前仅处理返回类型为object）赋值到instance.setupState，将组件的render函数赋值到instance.render上
    setupComponent(instance);

    // 3. 执行render函数、递归patch，渲染组件
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    // 执行render函数，生成vnode树
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);

    // 递归调用子VNode
    // 子节点树的 parentComponent 就是当前instance
    patch(subTree, container, instance);
    // 设置父组件的 vnode.el，使得proxy代理对象在处理this.$el时有值，不会报错undefined
    initialVNode.el = subTree.el;
  }

  return {
    createApp: createAppAPI(render),
  };
}
