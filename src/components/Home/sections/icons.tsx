import React from 'react'

const Defs = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f7b500" />
      <stop offset="0.5" stopColor="#e5307a" />
      <stop offset="1" stopColor="#5b2bd6" />
    </linearGradient>
    <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#e5307a" />
      <stop offset="1" stopColor="#4b1fc4" />
    </linearGradient>
  </defs>
)

/** Isometric box: top, left side, right side. */
function IsoBox({ x, y, w, h, id }: { x: number; y: number; w: number; h: number; id: string }) {
  const dx = w
  const dy = w / 2
  const top = `${x},${y} ${x + dx},${y - dy} ${x + 2 * dx},${y} ${x + dx},${y + dy}`
  const left = `${x},${y} ${x + dx},${y + dy} ${x + dx},${y + dy + h} ${x},${y + h}`
  const right = `${x + dx},${y + dy} ${x + 2 * dx},${y} ${x + 2 * dx},${y + h} ${x + dx},${y + dy + h}`
  return (
    <g strokeLinejoin="round" stroke="#fff" strokeWidth="1.5">
      <polygon points={top} fill="#f9c846" />
      <polygon points={left} fill={`url(#${id}-b)`} />
      <polygon points={right} fill={`url(#${id}-a)`} />
    </g>
  )
}

export const ProtectionIcon = () => (
  <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
    <Defs id="pi" />
    <IsoBox x={14} y={60} w={18} h={26} id="pi" />
    <IsoBox x={44} y={36} w={14} h={48} id="pi" />
    <IsoBox x={66} y={62} w={16} h={26} id="pi" />
    <IsoBox x={34} y={84} w={14} h={16} id="pi" />
    <IsoBox x={48} y={14} w={14} h={22} id="pi" />
  </svg>
)

export const AccessIcon = () => (
  <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
    <Defs id="ai" />
    {[0, 1, 2].map((i) => {
      const y = 38 + i * 20
      return (
        <g key={i} strokeLinejoin="round" stroke="#fff" strokeWidth="1.5">
          <polygon points={`60,${y - 26} 104,${y - 4} 60,${y + 18} 16,${y - 4}`} fill={i === 0 ? '#f9c846' : `url(#ai-b)`} />
          <polygon points={`16,${y - 4} 60,${y + 18} 60,${y + 28} 16,${y + 6}`} fill="url(#ai-b)" />
          <polygon points={`104,${y - 4} 60,${y + 18} 60,${y + 28} 104,${y + 6}`} fill="url(#ai-a)" />
        </g>
      )
    })}
  </svg>
)

export const ThreatIcon = () => (
  <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
    <Defs id="ti" />
    <g strokeLinejoin="round">
      <polygon points="60,10 104,34 104,84 60,108 16,84 16,34" fill="url(#ti-b)" />
      <polygon points="60,24 90,41 90,77 60,94 30,77 30,41" fill="#fff" />
      <polygon points="60,44 90,41 90,77 60,94" fill="url(#ti-a)" />
      <polygon points="60,10 104,34 60,44 16,34" fill="#f9c846" />
    </g>
  </svg>
)

export const LockIllustration = () => (
  <svg viewBox="0 0 400 320" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="lk-pill" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f7b500" />
        <stop offset="0.45" stopColor="#e5307a" />
        <stop offset="1" stopColor="#5b2bd6" />
      </linearGradient>
      <linearGradient id="lk-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e8e8ea" />
        <stop offset="1" stopColor="#a9a9ae" />
      </linearGradient>
    </defs>
    {/* shackle */}
    <path d="M205 150 V105 a50 50 0 0 1 100 0 V150" fill="none" stroke="#bdbdc2" strokeWidth="22" strokeLinecap="round" />
    <path d="M205 150 V105 a50 50 0 0 1 100 0 V150" fill="none" stroke="#9a9aa0" strokeWidth="4" strokeLinecap="round" opacity=".6" />
    {/* body */}
    <rect x="170" y="145" width="170" height="150" rx="14" fill="url(#lk-body)" stroke="#fff" strokeWidth="3" />
    <circle cx="255" cy="205" r="14" fill="#5b2bd6" />
    <circle cx="255" cy="205" r="6" fill="#e5307a" />
    <rect x="248" y="212" width="14" height="40" rx="7" fill="#5b2bd6" />
    {/* password pill */}
    <g transform="rotate(-24 120 180)">
      <rect x="20" y="150" width="200" height="56" rx="28" fill="url(#lk-pill)" stroke="#2a2a2e" strokeWidth="4" />
      <text x="120" y="190" textAnchor="middle" fontSize="34" fontWeight="700" fill="#fff" letterSpacing="6">
        *****
      </text>
    </g>
  </svg>
)
