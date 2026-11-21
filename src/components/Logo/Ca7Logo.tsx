import React from 'react'
import { BrainIcon } from './BrainIcon'

/**
 * CA7 logo: brain icon + the "CA7" wordmark drawn in blue dots (same style as the camera).
 * The same drawing is available as public/ca7-logo.svg.
 */
export const Ca7Logo = ({ className }: { className?: string }) => (
  <span className={`inline-flex items-center ${className ?? ''}`} role="img" aria-label="CA7">
    <BrainIcon className="h-[28px] w-[28px] shrink-0" />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/ca7-wordmark.svg" alt="" width={50} height={32} className="ml-[8px] h-[32px] w-auto" />
  </span>
)
