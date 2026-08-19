import React from 'react'
import type { Page } from '@/payload-types'
import { CerveauHero } from '@/heros/CerveauHero'

export const RenderHero: React.FC<Page['hero']> = (props) => {
  const { type } = props || {}

  if (type === 'none') return null

  return <CerveauHero {...props} />
}
