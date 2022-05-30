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
  // 根节点的children长度为1
  root.codegenNode = root.children[0];
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
  // 递归调用所有传入的nodeTransforms
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    transform(node);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      // 只有root和Element才有children属性
      // 【深度优先搜索】：遍历children，递归调用traverseNode
      traverseChildren(node, context);
      break;
    default:
      break;
  }
}

function traverseChildren(node: any, context: any) {
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}
