import React from 'react'

/** CA7 wordmark in blue dots (same style as the camera). The brain icon is only used as the favicon. */
export const Ca7Logo = ({ className }: { className?: string }) => (
  <span className={`inline-flex items-center ${className ?? ''}`} role="img" aria-label="CA7">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/ca7-wordmark.svg" alt="" width={72} height={32} className="h-[32px] w-auto" />
  </span>
)
