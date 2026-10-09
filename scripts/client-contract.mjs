// DSH 0.2.0-rc.2, official commit 639ed015397290b3745d163aafe02ffee4aa3f84:
// packages/client/web/src/platform.ts and packages/client/tsdown.client.ts.
// Use exact module-table keys; externalizing the whole namespace can emit
// require calls for modules the shell does not supply.
export const baselineModules = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

const inlineSafe = /^(?:@deepseek-ai\/dsh-(?:file-reference|session|llm|tools|brand|deque|output-retention|typert-protocol|util-crypto|util-values|util-workspace-path)(?:\/|$)|@deepseek-ai\/dsh-token-meter\/client$|@deepseek-ai\/dsh-native-command\/types$|@deepseek-ai\/dsh-host-open-in-app\/shared$|@deepseek-ai\/dsh-plugin-manager\/registry$|@deepseek-ai\/dsh-agent-preset-registry\/display$|@deepseek-ai\/dsh-api-workspace-controller\/default-workspace$|@deepseek-ai\/dsh-spill-policy\/notice$)/
const vendorLibrary = /^@deepseek-ai\/(?:cosmokit|schemastery)(?:\/|$)/
const generatedRemote = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

export function inlineSafeModule(specifier) {
  return inlineSafe.test(specifier) || vendorLibrary.test(specifier) || generatedRemote.test(specifier)
}

export function clientRequests(manifest) {
  const declared = manifest.dsh?.client?.external ?? []
  if (!Array.isArray(declared) || declared.some(item => typeof item !== 'string')) {
    throw new Error('dsh.client.external must be an array of exact module specifiers')
  }
  if (new Set(declared).size !== declared.length) throw new Error('dsh.client.external contains duplicate requests')
  for (const request of declared) {
    if (!request || request.includes('*') || request.startsWith('.') || request.startsWith('/')) {
      throw new Error(`Invalid module-table request: ${request}`)
    }
    if (baselineModules.includes(request)) throw new Error(`Baseline module must not be repeated in dsh.client.external: ${request}`)
  }
  return new Set([...baselineModules, ...declared])
}
