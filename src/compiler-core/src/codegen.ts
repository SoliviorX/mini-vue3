import { NodeTypes } from './ast';
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from './runtimeHelpers';
import { isString } from '../../shared/index';

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;

  // 导入依赖
  genFunctionPreamble(ast, context);

  const functionName = 'render';
  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');
  push(`function ${functionName}(${signature}){`);
  push('return ');
  genNode(ast.codegenNode, context);
  push('}');

  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = 'Vue';
  const aliasHelper = s => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
  }
  push('\n'); // 换行
  push('return ');
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `${helperMapName[key]}`;
    },
  };
  return context;
}

function genNode(node: any, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    default:
      break;
  }
}
function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}
function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`_${helper(TO_DISPLAY_STRING)}(`);
  // 递归处理表达式（插槽的content就是表达式）
  genNode(node.content, context);
  push(')');
}
function genExpression(node, context) {
  const { push } = context;
  push(`${node.content}`);
}
function genElement(node, context) {
  const { tag, children, props } = node;
  const { push, helper } = context;

  push(`_${helper(CREATE_ELEMENT_VNODE)}(`);
  genNodeList(genNullable([tag, props, children]), context);
  push(')');
}

function genNullable(args: any) {
  // 把末尾为null 的都删除掉
  let i = args.length;
  while (i--) {
    if (args[i] != null) break;
  }
  // 把为 falsy 的值都替换成 "null"
  return args.slice(0, i + 1).map(arg => arg || 'null');
}
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }
    // node 和 node 之间需要加上逗号；最后一个逗号不需要
    if (i < nodes.length - 1) {
      push(', ');
    }
  }
}

function genCompoundExpression(node: any, context: any) {
  const children = node.children;
  const { push } = context;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}
