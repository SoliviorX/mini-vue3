import { NodeTypes } from '../ast';
import { isText } from '../utils';

export function transformText(node, context) {
  let currentContainer;
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              // currentContainer 的目的是把相邻的节点都放到一个容器内
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push(' + ');
              currentContainer.children.push(next);
              // next节点已经放到容器里了，所以就把next节点删除
              children.splice(j, 1);
              // 因为把 j 删除了，所以这里就少了一个元素，那么 j 需要 --
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
