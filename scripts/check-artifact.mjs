import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { createContext, Script } from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clientRequests } from './client-contract.mjs'

/** Check module registration and packaging without activating DSH or account services. */
export async function checkArtifact(projectRoot, expected = {}) {
  const manifest = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'))
  const allowed = clientRequests(manifest)
  const source = await readFile(path.join(projectRoot, 'lib/client.js'), 'utf8')
  const registrations = []
  const context = createContext({
    window: { __ModuleLoader__: { load: registration => registrations.push(registration) } },
  })
  new Script(source, { filename: 'client.js' }).runInContext(context, { timeout: 1000 })
  assert.equal(registrations.length, 1, 'Client must register exactly one lazy factory')
  assert.equal(registrations[0].id, manifest.name)
  assert.equal(typeof registrations[0].factory, 'function')

  const requests = [...new Set([...source.matchAll(/\brequire\(["']([^"']+)["']\)/g)].map(match => match[1]))].sort()
  for (const request of requests) assert(allowed.has(request), `Undeclared browser require: ${request}`)
  if (expected.requests) assert.deepEqual(requests, expected.requests, 'Bundle requires must agree with esbuild graph')
  for (const artifact of ['lib/index.js', 'lib/types/index.d.ts', 'lib/types/client.d.ts', 'cordis.patch.yml']) {
    await access(path.join(projectRoot, artifact))
  }
  assert.equal(manifest.dsh.client.platform, 'web')
  assert(manifest.exports['./client'], 'Client export is required by the DSH scanner')
  console.log(`Artifact contract passed: one lazy registration; ${requests.length} declared shared-module request(s).`)
  return requests
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkArtifact(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'))
}
