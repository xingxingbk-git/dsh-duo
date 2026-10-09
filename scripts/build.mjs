import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createRequire, isBuiltin } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'
import { checkArtifact } from './check-artifact.mjs'
import { baselineModules, clientRequests, inlineSafeModule } from './client-contract.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const manifest = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'))
const outputDirectory = path.join(projectRoot, 'lib')
const requests = clientRequests(manifest)

await rm(outputDirectory, { recursive: true, force: true })
const tsc = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'], {
  cwd: projectRoot,
  stdio: 'inherit',
})
if (tsc.error) throw tsc.error
if (tsc.status !== 0) process.exit(tsc.status ?? 1)

// Host dependencies remain on disk, and Cordis keeps its owning runtime identity.
const host = await build({
  absWorkingDir: projectRoot,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  packages: 'external',
  metafile: true,
})
const hostPackages = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })
for (const output of Object.values(host.metafile.outputs)) {
  for (const imported of output.imports.filter(item => item.external)) {
    if (!isBuiltin(imported.path) && !hostPackages.some(name => imported.path === name || imported.path.startsWith(`${name}/`))) {
      throw new Error(`Host artifact imports a package absent from dependencies/peerDependencies: ${imported.path}`)
    }
  }
}

const candidates = ['src/client.tsx', 'src/client.ts']
const available = []
for (const candidate of candidates) {
  try {
    await access(path.join(projectRoot, candidate))
    available.push(candidate)
  } catch {
    // One browser entry is required; either extension is supported.
  }
}
if (available.length !== 1) throw new Error(`Expected one Client entry; found: ${available.join(', ') || 'none'}`)

const client = await build({
  absWorkingDir: projectRoot,
  entryPoints: available,
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env': JSON.stringify({ MODE: 'production' }),
  },
  metafile: true,
  write: false,
  plugins: [{
    name: 'dsh-module-contract',
    setup(plugin) {
      plugin.onResolve({ filter: /^[^./]/ }, ({ path: specifier }) => {
        if (requests.has(specifier)) return { path: specifier, external: true }
        if (specifier.startsWith('@deepseek-ai/') && !inlineSafeModule(specifier)) {
          return { errors: [{ text: `Unsupported DSH value import: ${specifier}. Use injected services or an official shared module; import type is erased.` }] }
        }
        return undefined
      })
    },
  }],
})

const clientBody = client.outputFiles.find(file => file.path.endsWith('/client.js'))?.text
if (!clientBody) throw new Error('esbuild produced no client bundle')
const externalRequests = [...new Set(Object.values(client.metafile.outputs)
  .flatMap(output => output.imports.filter(item => item.external).map(item => item.path)))].sort()
for (const request of externalRequests) {
  if (!requests.has(request)) throw new Error(`Client artifact requests undeclared module: ${request}`)
}
for (const moduleName of baselineModules) {
  if (Object.keys(client.metafile.inputs).some(input => input.includes(`/node_modules/${moduleName}/`))) {
    throw new Error(`Shared baseline was bundled privately: ${moduleName}`)
  }
}

// The official browser loader owns require; importing this artifact only
// registers its lazy factory and does not activate account services or UI.
const browserArtifact = `window.__ModuleLoader__.load({\n` +
  `  id: ${JSON.stringify(manifest.name)},\n` +
  `  factory: (require) => {\n` +
  `    var module = { exports: {} };\n` +
  `    var exports = module.exports;\n` +
  clientBody.split('\n').map(line => `    ${line}`).join('\n') + '\n' +
  `    return module.exports;\n` +
  `  },\n` +
  `});\n`

await mkdir(outputDirectory, { recursive: true })
await writeFile(path.join(outputDirectory, 'client.js'), browserArtifact, 'utf8')
await checkArtifact(projectRoot, { requests: externalRequests })
console.log(`Built ${manifest.name}: Host ESM, declarations, and lazy-CJS Client (${externalRequests.join(', ') || 'no runtime module requests'}).`)
