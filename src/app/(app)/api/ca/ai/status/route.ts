import { modelStatus } from '@/lib/ai/engine'

export const dynamic = 'force-dynamic'

/** GET /api/ca/ai/status: is the language model running? Without it the assistant still answers from the catalog. */
export async function GET() {
  const s = await modelStatus()
  return Response.json({ ...s, mode: s.installed ? 'model' : 'catalog' })
}
