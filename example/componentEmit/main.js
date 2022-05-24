import { App } from './App.js';
import { createApp } from '../../lib/guid-mini-vue.esm.js';

const rootContainer = document.querySelector('#root');
createApp(App).mount(rootContainer);
