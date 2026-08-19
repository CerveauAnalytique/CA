import { Button } from '@/components/ui/button'
import clsx from 'clsx'
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
  return (
    <Button
      variant="nav"
      size="clear"
      className={clsx("nav-link relative flex items-center gap-1.5 hover:cursor-pointer", className)}
      {...rest}
    >
      <ShoppingCart className="h-4 w-4" />
      <span>Cart</span>

      {quantity ? (
        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-black">
          {quantity}
        </span>
      ) : null}
    </Button>
  )
}
