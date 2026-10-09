import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tsc = spawnSync('tsc', ['-p', 'tsconfig.json'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (tsc.error) throw tsc.error
if (tsc.status !== 0) process.exit(tsc.status ?? 1)

const client = await build({
  absWorkingDir: projectRoot,
  entryPoints: ['src/client.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: ['@deepseek-ai/*', 'react', 'react-dom', 'react/jsx-runtime'],
  write: false,
})

const clientBody = client.outputFiles[0]?.text
if (!clientBody) throw new Error('esbuild produced no client bundle')

// DSH's browser module table expects each package bundle to register one
// memoizable CommonJS factory; dependencies resolve through the supplied require.
const browserArtifact = `window.__ModuleLoader__.load({\n` +
  `  id: 'dsh-duo',\n` +
  `  factory: (require) => {\n` +
  `    var module = { exports: {} };\n` +
  `    var exports = module.exports;\n` +
  clientBody.split('\n').map((line) => `    ${line}`).join('\n') + '\n' +
  `    return module.exports;\n` +
  `  },\n` +
  `});\n`

const outputDirectory = path.join(projectRoot, 'lib')
await mkdir(outputDirectory, { recursive: true })
await writeFile(path.join(outputDirectory, 'client.js'), browserArtifact, 'utf8')
console.log('Built dsh-duo host entry and DSH lazy-CJS client artifact.')
