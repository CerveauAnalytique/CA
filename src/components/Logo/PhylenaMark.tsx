import React from 'react'

/** The Phylena brain + P mark (brand kit: public/brand/phylena/logo). Drawn in `currentColor`. */
export const PhylenaMark = ({ className, title }: { className?: string; title?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="20 20 160 160" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
    <g fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
      <path d="M83.83 27.04 A30 30 0 0 0 49.47 70.00 A30 30 0 0 0 37.32 127.19 M49.47 130.00 A30 30 0 0 0 100.00 162.00 C 94 152 82 156 82 142 L82 64 C 82 50 94 48 100 38.00 A30 30 0 0 1 150.53 70.00 M162.68 72.81 A30 30 0 0 1 150.53 130.00 A30 30 0 0 1 116.17 172.96" />
      <path d="M97 56 L98 56 A20 20 0 0 1 98 96 L89 96" />
    </g>
  </svg>
)

/** Mark + "Phylena" name. */
export const PhylenaLogo = ({ className }: { className?: string }) => (
  <span className={`ca-brand ${className ?? ''}`} role="img" aria-label="Phylena">
    <PhylenaMark className="ca-brand__icon" />
    <b>Phylena</b>
  </span>
)
