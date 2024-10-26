declare module 'vite-plugin-eslint' {
    import { Plugin } from 'vite';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export default function eslintPlugin(options?: any): Plugin;
  }