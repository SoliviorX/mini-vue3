import { NodeTypes } from './ast';

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestors) {
  const nodes: any[] = [];
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (s.startsWith('{{')) {
      node = parseInterpolation(context);
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  const s = context.source;

  // 1. 遇到当前标签的结束标签时，退出循环
  // 2. 当栈中存在结束标签对应的开始标签，结束循环
  //    例如'<div><span></div>'，span没有结束标签，不会遇到span的结束标签，会进入死循环；当命中下一个结束标签'</div>'，且ancestors中存在div时，依然给它退出循环；
  if (s.startsWith('</')) {
    // 优化：当前标签处于栈顶，从后往前进行遍历
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }

  // 2. 当context.source有值的时候
  return !s;
}

function parseText(context: any) {
  let endIndex = context.source.length;
  let endTokens = ['<', '{{'];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    // endIndex取'<'和'{{'靠前的那个
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: any, length: number) {
  // 1. 获取content
  const content = context.source.slice(0, length);
  // 2. 推进template
  advanceBy(context, length);
  return content;
}

function parseElement(context: any, ancestors) {
  const element: any = parseTag(context, TagType.Start);

  ancestors.push(element);

  // 递归使用parseChildren解析元素内容；parseChildren返回一个nodes数组
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  // 若当前遇到的结束标签与开始标签一致，则删除；否则提示错误
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End); // 删除结束标签
  } else {
    throw new Error(`缺少结束标签：${element.tag}`);
  }

  return element;
}

// 是否遇到与开始标签对应的结束标签
function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith('</') && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context: any, type: TagType) {
  // 1. 解析tag
  // 如果处理开始标签<div>，其处理结果是 [ '<div', 'div', index: 0, input: '<div></div>', groups: undefined ]
  const match: any = /^<\/?([a-z]*)/i.exec(context.source); // 该正则可以处理开始标签，也能处理结束标签
  const tag = match[1];

  // TODO 解析标签属性

  // 2. template 删除处理完成的代码
  advanceBy(context, match[0].length); // 删除标签的 '<'、标签名及属性（如果是开始标签的话）
  advanceBy(context, 1); // 删除标签的右尖括号 '>'

  // 如果处理的是结束标签，不需要返回值
  if (type === TagType.End) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  const openDelimiter = '{{';
  const closeDelimiter = '}}';

  advanceBy(context, openDelimiter.length); // 删除 '{{'，context继续往前推进
  const closeIndex = context.source.indexOf(closeDelimiter); // indexOf匹配到从左到右的第一个结果匹配结果
  const rawContentLength = closeIndex;
  const rawContent = parseTextData(context, rawContentLength); // 获取rawContent，并推进context
  const content = rawContent.trim();
  advanceBy(context, closeDelimiter.length); // 删除'}}'，context继续往前推进
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}

function createParserContext(content: string): any {
  return {
    source: content,
  };
}
