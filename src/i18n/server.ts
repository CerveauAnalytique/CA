import { headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_HEADER, isLocale, type Locale } from './config'
import { dictionaries, translate, type Vars } from './translate'

export async function getLocale(): Promise<Locale> {
  const v = (await headers()).get(LOCALE_HEADER)
  return isLocale(v) ? v : DEFAULT_LOCALE
}

/** Server components: `const t = await getT(); t('Add to cart')` */
export async function getT() {
  const locale = await getLocale()
  return (text: string, vars?: Vars) => translate(locale, text, vars)
}

export { dictionaries }
