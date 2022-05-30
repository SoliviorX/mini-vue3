import { NodeTypes } from './ast';
import { TO_DISPLAY_STRING } from './runtimeHelpers';

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  // 遍历，调用nodeTransforms，递归children
  traverseNode(root, context);

  // 设置root.codegenNode
  createRootCodegen(root);

  // 设置root.helpers，添加render函数所需的依赖
  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: any) {
  const child = root.children[0];
  // 元素节点的codegenNode设为 children[0].codegenNode
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    // 根节点的children长度为1
    root.codegenNode = root.children[0];
  }
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(), // Map结构，保证依赖的唯一性，不重复导入
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function traverseNode(node: any, context) {
  const nodeTransforms = context.nodeTransforms;
  const exitFns: any = [];
  // 从前往后的顺序，收集每个层级的插件方法
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    const onExit = transform(node, context);
    if (onExit) exitFns.push(onExit);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      /**
       * 处理元素时不能在这里收集依赖；因为Root节点和element类型，都走到这一步，而Root节点是不需要引入createElementVNode的
       * 如果想在这里收集依赖，可以将swith改写成：
       * case NodeTypes.ROOT:
       *    traverseChildren(node, context);
       *    break;
       * case NodeTypes.ELEMENT:
       *    context.helper(CREATE_ELEMENT_VNODE);
       *    traverseChildren(node, context);
       *    break;
       *
       * 这样就比较繁琐，倒不如通过插件来引入依赖
       */

      // 只有root和Element才有children属性
      // 【深度优先搜索】：遍历children，递归调用traverseNode
      traverseChildren(node, context);
      break;
    default:
      break;
  }

  // 插件从后往前执行，从深层级向浅层级执行
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(node: any, context: any) {
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}
