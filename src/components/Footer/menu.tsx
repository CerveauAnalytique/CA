import type { Footer } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import React from 'react'

interface Props {
  menu: Footer['navItems']
}

export function FooterMenu({ menu }: Props) {
  if (!menu?.length) return null

  return (
    <div className="footer-col-links">
      {menu.map((item) => {
        return (
          <CMSLink
            key={item.id}
            appearance="inline"
            className="footer-col-link"
            {...item.link}
          />
        )
      })}
    </div>
  )
}
