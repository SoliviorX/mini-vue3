import { NodeTypes, createVNodeCall } from '../ast';
export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 中间处理层
      // 1. 处理tag，将tag转化成字符串
      const vnodeTag = `'${node.tag}'`;
      // 2. TODO 处理props
      let vnodeProps;
      // 3. 处理children
      // 经过transform处理后，node.children是长度为1的compouse类型节点
      const children = node.children;
      let vnodeChildren = children[0];

      node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
    };
  }
}
