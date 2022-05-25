import { createRenderer } from '../../lib/guid-mini-vue.esm.js';
import { App } from './App.js';

// 创建canvas，设置宽高
const game = new PIXI.Application({
  width: 500,
  height: 500,
});
// 将canvas放到body下
document.body.append(game.view);

const renderer = createRenderer({
  createElement(type) {
    if (type === 'rect') {
      // 创建一个矩形
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();
      return rect;
    }
  },
  insert(el, container) {
    container.addChild(el);
  },
  patchProp(el, key, val) {
    el[key] = val;
  },
  createText(text) {},
});
renderer.createApp(App).mount(game.stage);
