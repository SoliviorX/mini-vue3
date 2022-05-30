import { NodeTypes } from '../ast';

// 当前node是插值
export function transformExpression(node) {
  // 表达式在插值中
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

function processExpression(node: any) {
  // 处理表达式的content
  node.content = `_ctx.${node.content}`;
  return node;
}
