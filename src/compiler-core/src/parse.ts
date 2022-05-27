import { NodeTypes } from './ast';

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any[] = [];
  let node;
  const s = context.source;
  if (s.startsWith('{{')) {
    node = parseInterpolation(context);
  } else if (s[0] === '<') {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }

  if (!node) {
    node = parseText(context);
  }
  nodes.push(node);
  return nodes;
}

function parseText(context: any) {
  const content = parseTextData(context, context.source.length);

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

function parseElement(context: any) {
  const element = parseTag(context, TagType.Start);

  // TODO 解析元素内容

  parseTag(context, TagType.End);
  return element;
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
