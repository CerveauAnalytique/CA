import React from 'react'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { BannerClient } from './index.client'

/** Server part: reads the banner from the database (admin panel > Marketing banner). */
export async function MarketingBanner() {
  let banner: { enabled?: boolean | null; text?: string | null; linkLabel?: string | null; linkUrl?: string | null; color?: string | null; dismissible?: boolean | null } | null = null
  try {
    banner = await getCachedGlobal('banner', 0)()
  } catch {
    banner = null
  }
  if (!banner?.enabled || !banner.text) return null
  return <BannerClient text={banner.text} linkLabel={banner.linkLabel ?? ''} linkUrl={banner.linkUrl ?? ''} color={banner.color ?? 'blue'} dismissible={banner.dismissible !== false} />
}
