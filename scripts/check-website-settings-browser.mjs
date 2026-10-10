import { build } from 'esbuild'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const adapter = (await build({ absWorkingDir: root, entryPoints: ['src/website-settings.ts'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'chrome130' })).outputFiles[0].text
const headerAdapter=(await build({absWorkingDir:root,entryPoints:['src/website-header.ts'],bundle:true,write:false,format:'esm',platform:'browser',target:'chrome130'})).outputFiles[0].text
const files = {
  '/': ['text/html; charset=utf-8', await readFile(path.join(root, 'tests/browser/website-settings.fixture.html'))],
  '/fixture.js': ['text/javascript; charset=utf-8', await readFile(path.join(root, 'tests/browser/website-settings.fixture.js'))],
  '/header.js': ['text/javascript; charset=utf-8', headerAdapter],
  '/adapter.js': ['text/javascript; charset=utf-8', adapter],
}
const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/results') {
    let body = ''
    for await (const chunk of req) { body += chunk; if (body.length > 16000) { res.writeHead(413).end(); return } }
    try {
      const results = JSON.parse(body)
      const valid = Array.isArray(results) && results.length === 15 && results.every(result => typeof result.name === 'string' && typeof result.passed === 'boolean')
      const passed = valid && results.every(result => result.passed)
      console.log(JSON.stringify({ passed, results }, null, 2))
      res.writeHead(200).end('ok')
      server.close(() => { process.exitCode = passed ? 0 : 1 })
    } catch { res.writeHead(400).end() }
    return
  }
  const file = req.method === 'GET' && files[req.url]
  if (!file) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': file[0] }).end(file[1])
})
server.listen(0, '127.0.0.1', () => console.log(`Open the local regression fixture: http://127.0.0.1:${server.address().port}/`))
process.on('SIGINT', () => server.close())
