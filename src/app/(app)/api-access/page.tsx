import { redirect } from 'next/navigation'

/** The packs and prices live on /pricing. */
export default function ApiAccessPage() {
  redirect('/pricing')
}
