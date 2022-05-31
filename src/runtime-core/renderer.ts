import { effect } from '../reactivity/effect';
import { ShapeFlags } from '../shared/index';
import { createComponentInstance, setupComponent } from './component';
import { shouldUpdateComponent } from './componentUpdateUtils';
import { createAppAPI } from './createApp';
import { queueJobs } from './scheduler';
import { Fragment, Text } from './vnode';

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createText: hostCreateText,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    // render方法是在createApp中调用的，此时为根组件，parentComponent是null，anchor也是null
    patch(null, vnode, container, null, null);
  }

  // n1是老的vnode，如果n1不存在，则说明是初始化
  // n2是新的vnode
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2;

    switch (type) {
      // Fragment 只渲染 children
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 VNode 类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = hostCreateText(children));
    hostInsert(textNode, container);
  }

  function processElement(n1, n2: any, container: any, parentComponent, anchor) {
    if (!n1) {
      // 元素初始化
      mountElement(n2, container, parentComponent, anchor);
    } else {
      // 元素更新
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    // el 是在mountElement时赋值给vnode.el 的，更新时是没有vnode.el的，所以需要把旧vnode的el赋值给新vnode
    const el = (n2.el = n1.el);
    // 更新props
    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);

    // 更新children
    patchChildren(n1, n2, el, parentComponent, anchor);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    // 1. 如果新的children是text，老的children是Array或text
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果老的children是array，则把老的 children 清空
      if (prevShapFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children);
      }
      if (c1 !== c2) {
        // 当新旧text不相等时，直接将新的text插入节点中
        hostSetElementText(container, c2);
      }
    } else {
      // 2. 否则新的children是数组
      // 2.1 如果老的children是文本
      if (prevShapFlag & ShapeFlags.TEXT_CHILDREN) {
        // 清空文本
        hostSetElementText(container, '');
        // 渲染新的children
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // 2.2 否则老的children 也是数组
        // diff
        patchKeydChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeydChildren(c1, c2, container, parentComponent, parentAnchor) {
    const l2 = c2.length;
    let i = 0; // 指向队首
    let e1 = c1.length - 1; // 指向c1的末尾
    let e2 = l2 - 1; // 指向c2的末尾

    function isSameVNodeType(n1, n2) {
      // vnode.type和vnode.key都相等时，则为同一vnode
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 1. 首首比较
    while (i <= e1 && i <= e2) {
      // 获取i指向的节点
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        // 递归patch
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        // 退出循环
        break;
      }
      i++;
    }

    // 2. 尾尾比较
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        // 递归patch
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        // 退出循环
        break;
      }
      e1--;
      e2--;
    }

    // 3. 经过上述比较，newChildren有多的节点，需要创建新节点
    // i > e1 && i <= e2：多的元素无论是在队首还是队尾，都能匹配到
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        // 锚点是真实元素
        // e2 + 1 > c2.length则放到队尾，否则插入到nextPos之前
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          // anchor是固定的，不需要放入循环
          patch(null, c2[i], container, parentComponent, anchor);
          // 每插入一个节点，i向后移动一位
          i++;
        }
      }
    } else if (i > e2) {
      // 4. 经过上述比较，oldChildren有多的节点，需要删除多余的老节点
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 5. 经过上述比较，newChildren、oldChildren都有多的节点，进行乱序比较

      // 建立 key-index映射表，相对于遍历children查找对应的vnode，时间复杂度从 O(n) 降到 O(1)
      // 5.1 中间对比（经过首首对比、尾尾对比，只剩下了中间不同的元素）
      let s1 = i;
      let s2 = i;

      const toBepatched = e2 - s2 + 1; // newChildren中总共需要被比较的节点数量
      let patched = 0; // 已经处理过的节点数量

      let moved = false; // 用于判断是否需要移动位置
      let maxNewIndexSoFar = 0;

      // 创建一个长度固定的数组，每个元素都初始化为0（会面会将值设为对应位置旧节点的 索引+1）
      const newIndexToOldIndexMap = new Array(toBepatched);
      for (let i = 0; i < toBepatched; i++) {
        newIndexToOldIndexMap[i] = 0;
      }

      // 创建newChildren的key-index的映射表
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        let newIndex;
        // 如果newChildren中的节点已经全部被对比过，将oldChildren中剩余的节点直接删除
        if (patched >= toBepatched) {
          hostRemove(prevChild.el);
          continue; // 跳过本次循环
        }
        // 可见key的重要性：vnode有key，则直接从映射中取；否则遍历查找newChildren
        if (prevChild.key !== null) {
          // 如果能获取到prevChild.key对应的index，说明newChildren中有该节点
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        // 如果没有在newChildren找到对应的节点，则在oldChildren中删除该节点，否则递归更新节点
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 遍历旧队列时，index时从小到大；如果位置不变，对应的newIndex也应该时从小到大，如果后面的newIndex小于前面的，说明位置变了
          if (newIndex > maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          // 设置映射表，index从0开始，而不是从newIndex开始；
          // newIndexToOldIndexMap的含义：元素为0表示需要创建该元素；元素不为0，表示它在oldChildren上的位置。
          // i是oldChildren中节点的index，该index可能是0，而newIndexToOldIndexMap初始化的时候就是0，表示没有对应的老节点、需要创建新节点，所以这里我们给i+1，区别于初始值。
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      // 获得最长递增子序列，举例：[4,2,3] 获得最长递增子序列就是 [1,2]，意思就是index为1和2位置上的元素是最长自增子序列
      // 优化：使用 moved 参数判断是否有必要获取最长递增子序列
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;
      for (let i = toBepatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        // 如果newIndexToOldIndexMap的某一项为0，说明经过keyToNewIndexMap处理后，该位置依然没有对应的旧节点，需要创建节点
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // 移动位置
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      // el 是真实节点
      const el = children[i].el;
      hostRemove(el);
    }
  }

  // 更新props
  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) {
          // 当修改prop时：1. nextProp是一个新值；2.nextProp是undefined/null
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
      if (JSON.stringify(oldProps) !== '{}') {
        for (const key in oldProps) {
          // 删除newProps中没有的旧属性
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    // 将元素el存到vnode.el：访问this.$el时，即可从代理对象上访问instance.vnode.el
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;

    // 1. 处理children
    // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 children 类型
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果包含子节点
      mountChildren(vnode.children, el, parentComponent, anchor);
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果是文本节点
      hostSetElementText(el, children);
    }

    // 2. 初始化时添加props
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach(v => {
      // 处于元素初始化的流程中，没有旧vnode，设为null
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
    if (!n1) {
      // 组件初始化
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      // 组件更新
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    // 将n1的实例赋值给n2（和元素的更新类似，将n2.el赋值给n1.el）
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    // 1. 创建组件实例，并且将实例添加到vnode上
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
    ));
    // 2. 初始化组件属性：initProps、initSlots，调用setup、处理setup的返回值（当前仅处理返回类型为object）赋值到instance.setupState，将组件的render函数赋值到instance.render上
    setupComponent(instance);

    // 3. 执行render函数、递归patch，渲染组件
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    /**
     * 1. 使用effect包裹render逻辑，初次执行effect时会执行回调里的render函数，进行依赖收集；
     * 2. 当响应式对象的值发生变化时，会触发 _effect.run()，重新执行render函数。
     */
    // effect返回一个runner，调用runner会执行_effect.run()，即执行回调函数fn
    instance.update = effect(
      () => {
        const { proxy } = instance;
        // 如果是初始化
        if (!instance.isMounted) {
          console.log('init');
          // 执行render函数，生成vnode树
          const subTree = (instance.subTree = instance.render.call(proxy, proxy));
          // 子节点树的 parentComponent 就是当前instance，作为第四个参数传入
          patch(null, subTree, container, instance, anchor);
          // 设置父组件的 vnode.el，使得proxy代理对象在处理this.$el时有值，不会报错undefined
          initialVNode.el = subTree.el;
          instance.isMounted = true;
        } else {
          console.log('update');
          // next 是下一次更新时 render函数生成的vnode树，vnode是当前组件的vnode
          const { vnode, next } = instance;
          if (next) {
            next.el = vnode.el;
            // 更新instance中的数据
            updateComponentPreRender(instance, next);
          }
          const preSubTree = instance.subTree;
          const subTree = (instance.subTree = instance.render.call(proxy, proxy));
          patch(preSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          console.log('scheduler-update');
          // 将instance.update放入任务队列中
          queueJobs(instance.update);
        },
      },
    );
  }

  return {
    createApp: createAppAPI(render),
  };
}

function updateComponentPreRender(instance, nextVnode) {
  instance.vnode = nextVnode;
  instance.next = null;
  instance.props = nextVnode.props;
}

// 获得最长递增子序列
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
