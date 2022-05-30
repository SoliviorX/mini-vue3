import { NodeTypes } from './ast';
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from './runtimeHelpers';

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
  const { tag } = node;
  const { push, helper } = context;
  push(`_${helper(CREATE_ELEMENT_VNODE)}("${tag}")`);
}
