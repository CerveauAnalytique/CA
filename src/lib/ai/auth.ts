import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function whoAmI(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  const u = user as unknown as { id: number; roles?: string[]; aiConsent?: boolean; _strategy?: string } | null
  return { payload, user: u, consent: Boolean(u?.aiConsent), admin: Boolean(u?.roles?.includes('admin')) && u?._strategy !== 'api-key' }
}
