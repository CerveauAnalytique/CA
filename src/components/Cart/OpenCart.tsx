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
      className={clsx("nav-link relative flex h-9 w-9 items-center justify-center !rounded-full !p-0 hover:cursor-pointer", className)}
      {...rest}
    >
      <ShoppingCart className="h-[18px] w-[18px]" aria-label={t('Cart')} />

      {quantity ? (
        <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
          {quantity}
        </span>
      ) : null}
    </Button>
  )
}
