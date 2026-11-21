import React from 'react'

export type DotIconName =
  | 'alert' | 'analytics' | 'api' | 'apps' | 'camera' | 'chat' | 'database' | 'datasets' | 'export'
  | 'helpdesk' | 'integrate' | 'key' | 'models' | 'ops' | 'security' | 'sensor' | 'share' | 'shop'
  | 'support' | 'team'

/** Blue dot-style icon (same look as the camera and the CA7 wordmark). Files live in public/icons. */
export function DotIcon({ name, size = 40, className }: { name: DotIconName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/icons/${name}.svg`} alt="" width={size} height={size} className={className} style={{ width: size, height: size }} />
  )
}
