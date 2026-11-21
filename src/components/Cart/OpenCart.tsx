import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import { useT } from '@/i18n/client'
import { ShoppingCart } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  const t = useT()
  return (
    <Button
      variant="nav"
      size="clear"
      className={clsx("nav-link relative flex items-center gap-1.5 hover:cursor-pointer", className)}
      {...rest}
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="max-md:hidden">{t('Cart')}</span>

      {quantity ? (
        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-black">
          {quantity}
        </span>
      ) : null}
    </Button>
  )
}
