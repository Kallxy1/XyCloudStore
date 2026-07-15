'use client'

import Image from 'next/image'
import { X, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'

interface CartItemProps {
  item: {
    id: string
    productId: string
    variantId?: string | null
    quantity: number
    product: {
      id: string
      slug: string
      name: string
      basePrice: number
      images: Array<{ url: string }>
      trackQuantity: boolean
      quantity: number
    }
    variant?: {
      id: string
      name: string
      value: string
      price: number
      quantity: number
      image?: string | null
    } | null
  }
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const { product, variant, quantity } = item

  const price = product.basePrice + (variant?.price || 0)
  const subtotal = price * quantity
  const maxStock = variant?.quantity ?? product.quantity
  const isOutOfStock = product.trackQuantity && maxStock <= 0
  const isLowStock = product.trackQuantity && maxStock <= 5 && maxStock > 0

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) return
    if (product.trackQuantity && newQuantity > maxStock) return
    updateQuantity(item.id, newQuantity)
  }

  return (
    <div className="flex gap-4 p-4 border-b">
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={variant?.image || product.images[0]?.url || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {variant && (
            <p className="text-sm text-muted-foreground mt-1">
              {variant.name}: {variant.value}
            </p>
          )}
          <p className="text-sm font-semibold text-primary mt-1">{formatCurrency(price)}</p>
        </div>

        {/* Quantity & Remove */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border rounded-lg">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleUpdateQuantity(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleUpdateQuantity(quantity + 1)}
              disabled={product.trackQuantity && quantity >= maxStock}
              aria-label="Tambah jumlah"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(item.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>

        {/* Stock Status */}
        {isOutOfStock && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            Stok habis
          </p>
        )}
        {isLowStock && !isOutOfStock && (
          <p className="text-xs text-warning flex items-center gap-1 mt-2">
            Sisa {maxStock} item
          </p>
        )}
      </div>

      {/* Subtotal */}
      <div className="flex flex-col items-end justify-between min-w-[100px]">
        <p className="font-semibold text-right">{formatCurrency(subtotal)}</p>
        {product.trackQuantity && maxStock > 0 && (
          <p className="text-xs text-muted-foreground text-right">Maks: {maxStock}</p>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'