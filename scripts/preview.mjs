/** Local development preview only. The package files allowlist excludes this server and its fixtures. */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const html = await readFile(path.join(root, 'preview/index.html'))
const result = await build({
  absWorkingDir: root, entryPoints: ['preview/main.tsx'], bundle: true, write: false,
  format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': JSON.stringify('development') },
  plugins: [{
    name: 'preview-official-fish-only',
    setup(plugin) {
      // Production uses DSH's shared baseline. Preview only needs its installed,
      // unchanged FishLogo; loading the whole library would require unrelated UI deps.
      plugin.onResolve({ filter: /^@deepseek-ai\/dsh-client-ui-primitives$/ }, () => ({ path: 'FishLogo', namespace: 'preview-official-fish' }))
      plugin.onLoad({ filter: /.*/, namespace: 'preview-official-fish' }, async () => {
        const source = await readFile(require.resolve('@deepseek-ai/dsh-client-ui-primitives'), 'utf8')
        const begin = source.indexOf('//#region lib/types/FishLogo.js')
        const end = source.indexOf('//#endregion', begin)
        if (begin < 0 || end < 0) throw new Error('Installed rc.2 FishLogo region is unavailable; preview must be adapted explicitly.')
        return { contents: `import { jsx } from 'react/jsx-runtime';\n${source.slice(begin, end)}\nexport { FishLogo };`, loader: 'js', resolveDir: root }
      })
    },
  }],
})
const bundle = result.outputFiles[0].contents
const server = createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  if (request.url === '/' || request.url === '/index.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(html)
  } else if (request.url === '/preview.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); response.end(bundle)
  } else {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found')
  }
})
server.listen(4189, '127.0.0.1', () => {
  console.log('dsh-duo development mock preview: http://127.0.0.1:4189')
  console.log('No official webpage or credentials are loaded. Restart this command after source changes.')
})
server.on('error', error => { console.error(error.message); process.exitCode = 1 })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(() => process.exit(0)) })
