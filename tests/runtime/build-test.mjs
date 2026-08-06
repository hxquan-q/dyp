// 前端运行时辅助函数测试构建脚本
// 用 esbuild 将 reverse-runtime 的纯辅助函数打包成可执行的 CJS，配合 stub 在 Node 下运行。
import { build } from 'esbuild'
import path from 'path'

const rt = path.resolve(import.meta.dirname)       // print/tests/runtime/
const project = path.resolve(rt, '..', '..')       // print/
const fs = path.resolve(project, 'frontend-src')   // print/frontend-src/
const uiStub = path.join(rt, 'stub-ui.js')
const reactStub = path.join(rt, 'react')

await build({
  entryPoints: [path.join(rt, 'runtime-helpers-test.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: path.join(rt, 'out.js'),
  alias: {
    'react': reactStub,
    '@inertiajs/react': path.join(rt, 'stub-inertia.js'),
    '@/components/toast-provider': path.join(rt, 'stub-toast.js'),
    '@': path.join(fs, 'src'),
  },
  plugins: [{
    name: 'ui-stub',
    setup(b) {
      b.onResolve({ filter: /^@\/components\/ui\// }, () => ({ path: uiStub }))
    },
  }],
}).then(() => console.log('bundled OK')).catch((e) => { console.error('BUNDLE ERROR:', e.message.split('\n').slice(0, 4).join('\n')); process.exit(1) })
