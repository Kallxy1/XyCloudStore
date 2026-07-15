'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, cn } from '@/lib/utils'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCart } from '@/hooks/use-cart'

interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    price: number
    compareAtPrice?: number | null
    image: string
    isFeatured?: boolean
    quantity: number
    trackQuantity: boolean
  }
  variant?: 'default' | 'compact' | 'featured'
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCart, isLoading: cartLoading } = useCart()
  const inWishlist = isInWishlist(product.id)

  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const isOutOfStock = product.trackQuantity && product.quantity <= 0

  if (variant === 'compact') {
    return (
      <Link href={`/products/${product.slug}`} className="flex gap-3 group">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="80px"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <article className="group flex flex-col h-full">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discountPercent > 0 && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              -{discountPercent}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              <Tag className="h-3 w-3 mr-1" /> Unggulan
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(product.id)
          }}
          className={cn(
            'absolute right-2 top-2 p-1.5 rounded-full bg-background/80 backdrop-blur opacity-0 transition-all group-hover:opacity-100',
            inWishlist && 'opacity-100 text-destructive'
          )}
          aria-label={inWishlist ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        >
          <Heart className={cn('h-4 w-4', inWishlist && 'fill-current')} />
        </button>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              Stok Habis
            </Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col mt-3">
        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="mt-auto flex items-center gap-2">
          <span className="text-base font-bold text-primary">{formatCurrency(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            addToCart(product.id, 1)
          }}
          disabled={isOutOfStock || cartLoading}
          className="mt-3 w-full"
          size="sm"
        >
          {isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
        </Button>
      </div>
    </article>
  )
}