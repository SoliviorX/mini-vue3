import { generate } from '../src/codegen';
import { baseParse } from '../src/parse';
import { transform } from '../src/transform';
import { transformElement } from '../src/transforms/transformElement';
import { transformExpression } from '../src/transforms/transformExpression';

describe('codegen', () => {
  it('string', () => {
    const ast = baseParse('hello');
    transform(ast);
    const { code } = generate(ast);
    /**
     * 快照测试（第一次执行测试，对结果拍了张照片，会生成一个快照文件，之后测试时将新的结果与快照对比即可）：
     * 1. 抓bug（无意间修改了代码，导致快照更新）
     * 2. 有意更新，创建新的快照
     */
    expect(code).toMatchSnapshot();
  });

  it('interpolation', () => {
    const ast = baseParse('{{message}}');
    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it('element', () => {
    const ast = baseParse('<div></div>');
    transform(ast, {
      nodeTransforms: [transformElement],
    });
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});
