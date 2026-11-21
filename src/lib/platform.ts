/**
 * The platform services CA7 runs next to the website (see platform/README.md).
 * Each one has an address in an environment variable; when it is not set, the settings page says "Not connected".
 */
export type PlatformService = {
  id: 'openremote' | 'dify' | 'airbyte' | 'thingsboard' | 'timescale'
  name: string
  role: string
  text: string
  env: string
  /** path that answers when the service is up (checked from the server) */
  health?: string
  defaultUrl: string
}

export const PLATFORM: PlatformService[] = [
  { id: 'openremote', name: 'OpenRemote', role: 'IoT, devices, tenants, users, rules', text: 'Manages devices, assets, users and rules per tenant.', env: 'OPENREMOTE_URL', health: '/', defaultUrl: 'https://localhost' },
  { id: 'dify', name: 'Dify', role: 'AI workflows, agents, RAG', text: 'Build AI workflows and agents that answer from your documents and data.', env: 'DIFY_URL', health: '/', defaultUrl: 'http://localhost:8081' },
  { id: 'airbyte', name: 'Airbyte', role: 'Connectors, sync, data pipelines', text: 'Moves data from hundreds of systems into your CA7 database.', env: 'AIRBYTE_URL', health: '/api/v1/health', defaultUrl: 'http://localhost:8000' },
  { id: 'thingsboard', name: 'ThingsBoard', role: 'IoT dashboards and device telemetry', text: 'Device telemetry, dashboards and alarms. Alternative to OpenRemote for dashboards.', env: 'THINGSBOARD_URL', health: '/', defaultUrl: 'http://localhost:8085' },
]

export function serviceUrl(s: PlatformService) {
  return (process.env[s.env] || '').replace(/\/$/, '') || null
}

/** Checks from the server whether the service answers. Never throws. */
export async function checkService(s: PlatformService): Promise<'online' | 'offline' | 'not-connected'> {
  const base = serviceUrl(s)
  if (!base) return 'not-connected'
  try {
    const res = await fetch(base + (s.health ?? '/'), { signal: AbortSignal.timeout(3000), redirect: 'manual', cache: 'no-store' })
    return res.status < 500 ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}
