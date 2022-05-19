// rollup 默认支持esm
import pkg from './package.json';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/index.ts',
  output: [
    // 输出两种格式的打包文件：cjs & esm
    {
      format: 'cjs',
      file: pkg.main,
    },
    {
      format: 'es',
      file: pkg.module,
    },
  ],
  plugins: [typescript()],
};
