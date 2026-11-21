import { redirect } from 'next/navigation'

/** The marketplace lives in the shop. */
export default function MarketplacePage() {
  redirect('/shop')
}
