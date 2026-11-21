import { APIError, type CollectionConfig, type Config, type Plugin } from 'payload'
import { activeBlock, recordEvent, verifyOrderPrices } from './engine'
import { hashIp, ipOf } from './privacy'

const SKIP = new Set(['security-events', 'security-alerts', 'security-blocks', 'security-rules', 'ai-decisions', 'payload-preferences', 'payload-migrations', 'payload-locked-documents', 'payload-kv'])
/** Fields only an admin may set: a customer who sends one of these is trying to escalate. */
const PRIVILEGED = ['roles', 'plan', 'suspended', 'suspendedReason', 'stripeCustomerId', 'stripeSubscriptionId', 'apiCallsMonth', 'usageMonth']

const isAdmin = (u: unknown) => Boolean((u as { roles?: string[] } | null)?.roles?.includes('admin'))

type Req = { headers?: Headers; user?: unknown; payload: import('payload').Payload; data?: Record<string, unknown>; url?: string }
const ip = (req: Req) => ipOf(req.headers)
const uid = (req: Req) => (req.user as { id?: string | number } | null | undefined)?.id

/**
 * Security monitoring hooks for every collection: audit of admin changes, login/sign-up/profile events,
 * privilege escalation, price manipulation, failed payments and suspended accounts. See docs/SECURITY.md.
 */
export const securityPlugin: Plugin = (config: Config): Config => {
  config.collections = (config.collections ?? []).map((c): CollectionConfig => {
    if (SKIP.has(c.slug)) return c
    const hooks: Record<string, unknown[]> = { ...((c.hooks ?? {}) as Record<string, unknown[]>) }
    const add = (k: string, fn: unknown) => {
      hooks[k] = [...(hooks[k] ?? []), fn]
    }

    // every admin change and deletion is logged
    add('afterChange', async ({ req, operation }: { req: Req; operation: string }) => {
      if (isAdmin(req.user)) await recordEvent(req.payload, { category: 'admin_change', ip: ip(req), userId: uid(req), evidence: { collection: c.slug, operation } })
    })
    add('afterDelete', async ({ req }: { req: Req }) => {
      if (isAdmin(req.user)) await recordEvent(req.payload, { category: 'admin_delete', ip: ip(req), userId: uid(req), evidence: { collection: c.slug } })
    })

    if (c.slug === 'users') {
      add('beforeOperation', async ({ args, operation }: { args: { req: Req; id?: string | number; overrideAccess?: boolean }; operation: string }) => {
        const req = args.req
        if (operation !== 'create' && operation !== 'update') return args
        // server code (billing webhooks, scripts) uses overrideAccess; only requests from outside are checked
        if (args.overrideAccess) return args
        if (isAdmin(req.user)) return args
        const data = (req.data ?? {}) as Record<string, unknown>
        const sent = PRIVILEGED.filter((k) => k in data)
        const own = args.id != null && String(args.id) === String(uid(req))
        const someoneElse = operation === 'update' && !own
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
          if (totalDocs === 0) return args // the first account becomes admin
        }
        if (sent.length || someoneElse) {
          await recordEvent(req.payload, { category: 'privilege_escalation', ip: ip(req), userId: uid(req), evidence: { fields: sent, target: someoneElse ? 'other_account' : 'own_account' } })
          throw new APIError('This request is not allowed.', 403, undefined, true)
        }
        return args
      })

      add('beforeLogin', async ({ req, user }: { req: Req; user: { id: number; suspended?: boolean } }) => {
        if (user.suspended) throw new APIError('This account is suspended. Contact support.', 403, undefined, true)
        const address = ip(req)
        const block = await activeBlock(req.payload, { userId: user.id, ipHash: address === 'unknown' ? undefined : hashIp(address) })
        if (block) throw new APIError('Too many suspicious attempts. Try again later or contact support.', 429, undefined, true)
        return user
      })
      add('afterLogin', async ({ req, user }: { req: Req; user: { id: number } }) => {
        await recordEvent(req.payload, { category: 'login_ok', ip: ip(req), userId: user.id })
      })
      add('afterLogout', async ({ req }: { req: Req }) => {
        await recordEvent(req.payload, { category: 'logout', ip: ip(req), userId: uid(req) })
      })
      add('afterError', async ({ req, error }: { req: Req; error: unknown }) => {
        if (!req.url?.includes('/users/login')) return
        const status = (error as { status?: number }).status
        if (status === 429 || status === 403) return // already a block or a suspended account
        const email = typeof req.data?.email === 'string' ? req.data.email : undefined
        await recordEvent(req.payload, { category: 'login_failed', ip: ip(req), email })
      })
      add('afterChange', async ({ req, operation, doc }: { req: Req; operation: string; doc: { id: number } }) => {
        if (operation === 'create') await recordEvent(req.payload, { category: 'signup', ip: ip(req), userId: doc.id })
        else if (!isAdmin(req.user) && String(uid(req)) === String(doc.id)) await recordEvent(req.payload, { category: 'profile_change', ip: ip(req), userId: doc.id })
      })
    }

    if (c.slug === 'orders') {
      add('beforeChange', async ({ req, data, operation }: { req: Req; data: Record<string, any>; operation: string }) => {
        if (operation !== 'create') return data
        const items = (data.items ?? []) as { product?: number | { id: number }; variant?: number | { id: number } | null; quantity?: number }[]
        const priced = await Promise.all(
          items.map(async (i) => {
            const pid = typeof i.product === 'object' ? i.product?.id : i.product
            const vid = typeof i.variant === 'object' ? i.variant?.id : i.variant
            const rec = vid
              ? await req.payload.findByID({ collection: 'variants', id: vid, depth: 0, overrideAccess: true }).catch(() => null)
              : pid
                ? await req.payload.findByID({ collection: 'products', id: pid, depth: 0, overrideAccess: true }).catch(() => null)
                : null
            return { quantity: i.quantity ?? 1, price: (rec as { priceInUSD?: number | null } | null)?.priceInUSD }
          }),
        )
        const check = verifyOrderPrices(priced, data.amount)
        const userId = uid(req) ?? (typeof data.customer === 'object' ? data.customer?.id : data.customer)
        if (!check.ok) {
          await recordEvent(req.payload, { category: 'price_manipulation', ip: ip(req), userId, evidence: { expected: check.expected, sent: data.amount } })
          throw new APIError('The order does not match the prices of the shop.', 400, undefined, true)
        }
        await recordEvent(req.payload, { category: 'order_created', ip: ip(req), userId })
        return data
      })
    }

    if (c.slug === 'transactions') {
      add('afterChange', async ({ req, doc, previousDoc }: { req: Req; doc: { status?: string; customer?: number | { id: number } | null }; previousDoc?: { status?: string } }) => {
        if (['failed', 'canceled', 'expired'].includes(String(doc.status)) && previousDoc?.status !== doc.status) {
          await recordEvent(req.payload, { category: 'payment_failed', ip: ip(req), userId: typeof doc.customer === 'object' ? doc.customer?.id : doc.customer })
        }
      })
    }

    return { ...c, hooks } as CollectionConfig
  })
  return config
}
