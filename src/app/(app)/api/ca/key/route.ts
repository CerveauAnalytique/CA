import { randomBytes } from 'node:crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

async function sessionUser(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  // An API key must never be able to create or revoke keys: require a real login session.
  const strategy = (user as unknown as { _strategy?: string } | null)?._strategy
  return { payload, user: strategy === 'api-key' ? null : user }
}

/** POST: create (or replace) the API key of the logged-in user. The key is shown once. */
export async function POST(request: Request) {
  const { payload, user } = await sessionUser(request)
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })

  const apiKey = `ca_${randomBytes(24).toString('hex')}`
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { enableAPIKey: true, apiKey },
    overrideAccess: false,
    user,
  })
  return Response.json({ apiKey })
}

/** DELETE: turn the API key off. */
export async function DELETE(request: Request) {
  const { payload, user } = await sessionUser(request)
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { enableAPIKey: false },
    overrideAccess: false,
    user,
  })
  return Response.json({ ok: true })
}
