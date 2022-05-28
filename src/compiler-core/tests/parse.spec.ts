import { NodeTypes } from '../src/ast';
import { baseParse } from '../src/parse';

describe('parse', () => {
  describe('interpolation', () => {
    test('simple interpolation', () => {
      const ast = baseParse('{{ message }}');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message',
        },
      });
    });
  });

  describe('element', () => {
    it('simple element div', () => {
      const ast = baseParse('<div></div>');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        children: [],
      });
    });
  });

  describe('text', () => {
    it('simple text', () => {
      const ast = baseParse('some text');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text',
      });
    });
  });

  // 1. 处理标签时需要递归parseChildren，递归的结束条件是遇到结束标签，或者template为空
  // 2. 处理text时，当遇到插值时，应该结束
  test('hello world', () => {
    const ast = baseParse('<div>hello,{{message}}</div>');
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.TEXT,
          content: 'hello,',
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    });
  });

  // 处理文本 `hi</p>{{...}}...` 时，左尖括号也是一个endToken
  test('nested element', () => {
    const ast = baseParse('<div><p>hi</p>hello,{{message}}</div>');
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'p',
          children: [
            {
              type: NodeTypes.TEXT,
              content: 'hi',
            },
          ],
        },
        {
          type: NodeTypes.TEXT,
          content: 'hello,',
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    });
  });

  // 没有结束标签时，isEnd永远时false，造成死循环
  test('should throw error when lack end tag', () => {
    expect(() => {
      baseParse('<div><span></div>');
    }).toThrow('缺少结束标签：span');
  });
});
