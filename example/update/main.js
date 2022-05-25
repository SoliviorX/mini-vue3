import { createApp } from '../../lib/guid-mini-vue.esm.js';
import { App } from './App.js';

const rootContainer = document.querySelector('#root');
createApp(App).mount(rootContainer);
