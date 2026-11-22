import type { Payload } from 'payload'

/** Demo products (no images needed) so the shop is not empty. Idempotent: skips slugs that exist. */
export const DEMO_PRODUCTS = [
  { title: 'CA7 Camera Agent License', slug: 'camera-agent-license', price: 4900, stock: 500, text: 'Run the CA7 desktop camera agent on one computer. Counts people, vehicles and objects, and sends the numbers to your CA7 account.' },
  { title: 'Smart Temperature Sensor', slug: 'smart-temperature-sensor', price: 2900, stock: 120, text: 'Wi-Fi temperature and humidity sensor that pushes readings straight to /api/ca/ingest.' },
  { title: 'IoT Gateway Box', slug: 'iot-gateway-box', price: 14900, stock: 40, text: 'Small gateway that bridges MQTT and Modbus devices to your CA7 data sources.' },
  { title: 'Data Starter Pack (10 sources)', slug: 'data-starter-pack', price: 1900, stock: 9999, text: 'Setup guide and templates for ten ready-made data sources.' },
  { title: 'Onboarding Session (1 hour)', slug: 'onboarding-session', price: 9900, stock: 25, text: 'A one-hour online session to connect your first sources, build a dashboard and set up automations.' },
]

const lexical = (t: string) => ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', children: [{ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] }] } })

export async function seedDemoShop(payload: Payload) {
  let created = 0
  for (const p of DEMO_PRODUCTS) {
    const exists = await payload.find({ collection: 'products', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, overrideAccess: true })
    if (exists.docs[0]) continue
    await payload.create({
      collection: 'products',
      data: { title: p.title, slug: p.slug, _status: 'published', enableVariants: false, priceInUSDEnabled: true, priceInUSD: p.price, inventory: p.stock, description: lexical(p.text) as never, meta: { title: p.title, description: p.text } } as never,
      overrideAccess: true,
    })
    created++
  }
  return { created, total: DEMO_PRODUCTS.length }
}
