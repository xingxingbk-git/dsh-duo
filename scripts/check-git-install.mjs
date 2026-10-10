import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { checkArtifact } from './check-artifact.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'dsh-duo-git-install-'))
const source = path.join(temporaryRoot, 'source')
const consumer = path.join(temporaryRoot, 'consumer')
const pnpm = process.env.DSH_DUO_INSTALL_PNPM ?? process.env.npm_execpath
assert(pnpm, 'Run this check through pnpm check:git-install')

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', ...options })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  assert.equal(result.status, 0, `${command} ${args[0]} failed`)
  return result.stdout
}

try {
  await mkdir(source)
  await mkdir(consumer)
  // A source-only Git fixture deliberately excludes lib, dependencies and local data.
  for (const item of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'cordis.patch.yml', 'README.md', 'src', 'scripts']) {
    await cp(path.join(projectRoot, item), path.join(source, item), { recursive: true })
  }
  await writeFile(path.join(source, '.gitignore'), 'node_modules/\nlib/\nartifacts/\n')
  run('git', ['init', '--quiet'], source)
  run('git', ['add', '.'], source)
  run('git', ['-c', 'user.name=Installation fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'Source-only installation fixture'], source)
  const sha = run('git', ['rev-parse', 'HEAD'], source).trim()
  const specifier = `git+${pathToFileURL(source).href}#${sha}`
  await writeFile(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  const major = Number(run(process.execPath, [pnpm, '--version'], consumer).trim().split('.')[0])
  assert(major >= 10, 'Git installation check requires pnpm 10 or later')
  // pnpm 11 authorizes a Git identity; pnpm 10's allowBuilds only accepts versions.
  const approval = major >= 11 ? [] : ['--allow-build=dsh-duo']
  if (major >= 11) {
    await writeFile(path.join(consumer, 'pnpm-workspace.yaml'), `allowBuilds:\n  ${JSON.stringify(`dsh-duo@${specifier}`)}: true\n`)
  }
  run(process.execPath, [pnpm, 'add', specifier, ...approval, '--reporter=append-only'], consumer)
  const installed = path.join(consumer, 'node_modules/dsh-duo')
  await checkArtifact(installed)
  const installedManifest = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'))
  assert.equal(installedManifest.name, 'dsh-duo')
  run(process.execPath, ['--input-type=module', '-e', "const p = await import('dsh-duo'); if (p.name !== 'dsh-duo' || typeof p.apply !== 'function') process.exit(1); console.log('Installed Git package Host import passed.');"], consumer)
  console.log('Source-only Git install passed: prepare built both entries; installed Host imports and Client registers lazily.')
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
