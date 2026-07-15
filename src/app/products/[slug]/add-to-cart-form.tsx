'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart, Heart, Truck, Shield, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, cn } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'

interface AddToCartFormProps {
  product: {
    id: string
    slug: string
    name: string
    basePrice: number
    compareAtPrice?: number | null
    quantity: number
    trackQuantity: boolean
    variants: Array<{
      id: string
      name: string
      value: string
      price: number
      quantity: number
      image?: string | null
    }>
  }
}

export function AddToCartForm({ product }: AddToCartFormProps) {
  const { addToCart, isLoading } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)

  const inWishlist = isInWishlist(product.id)

  const maxStock = selectedVariant
    ? product.variants.find(v => v.id === selectedVariant)?.quantity ?? 0
    : product.quantity

  const variantPrice = selectedVariant
    ? product.variants.find(v => v.id === selectedVariant)?.price ?? 0
    : 0

  const currentPrice = product.basePrice + variantPrice
  const isOutOfStock = product.trackQuantity && maxStock <= 0
  const isLowStock = product.trackQuantity && maxStock > 0 && maxStock <= 5

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity < 1) return
    if (product.trackQuantity && newQuantity > maxStock) return
    setQuantity(newQuantity)
  }

  const handleAddToCart = async () => {
    if (isOutOfStock) return
    
    await addToCart(product.id, quantity, selectedVariant || undefined)
    setQuantity(1)
  }

  const handleWishlist = () => {
    toggleWishlist(product.id, selectedVariant || undefined)
  }

  // Group variants by name (e.g., "Warna", "Ukuran")
  const variantGroups = product.variants.reduce((acc, variant) => {
    if (!acc[variant.name]) acc[variant.name] = []
    acc[variant.name].push(variant)
    return acc
  }, {} as Record<string, typeof product.variants>)

  return (
    <div className="space-y-6 p-6 bg-muted/30 rounded-xl">
      {/* Variant Selection */}
      {Object.keys(variantGroups).length > 0 && (
        <div className="space-y-4">
          {Object.entries(variantGroups).map(([name, variants]) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-2">{name}</label>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(
                      selectedVariant === variant.id ? null : variant.id
                    )}
                    className={cn(
                      'px-4 py-2 border rounded-lg text-sm font-medium transition-all',
                      selectedVariant === variant.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : product.trackQuantity && variant.quantity <= 0
                        ? 'border-muted bg-muted text-muted-foreground line-through cursor-not-allowed'
                        : 'border-border hover:border-primary hover:bg-accent'
                    )}
                    disabled={product.trackQuantity && variant.quantity <= 0}
                    aria-pressed={selectedVariant === variant.id}
                  >
                    {variant.value}
                    {variant.price !== 0 && (
                      <span className="ml-2 text-xs">({variant.price > 0 ? '+' : ''}{formatCurrency(Math.abs(variant.price))})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Display */}
      <div className="flex items-baseline gap-4">
        <span className="text-2xl font-bold text-primary">{formatCurrency(currentPrice)}</span>
        {product.compareAtPrice && product.compareAtPrice > currentPrice && (
          <span className="text-lg text-muted-foreground line-through">
            {formatCurrency(product.compareAtPrice)}
          </span>
        )}
      </div>

      {/* Stock Status */}
      {(isOutOfStock || isLowStock) && (
        <p className={cn('text-sm flex items-center gap-1', isOutOfStock ? 'text-destructive' : 'text-warning')}>
          {isOutOfStock ? (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              Stok habis
            </>
          ) : (
            <>
              <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              Sisa {maxStock} item
            </>
          )}
        </p>
      )}

      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="flex items-center gap-4">
          <label htmlFor="quantity" className="font-medium">Jumlah:</label>
          <div className="flex items-center border rounded-lg">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              aria-label="Kurangi"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              id="quantity"
              type="number"
              min="1"
              max={product.trackQuantity ? maxStock : 99}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                if (val >= 1 && (!product.trackQuantity || val <= maxStock)) {
                  setQuantity(val)
                }
              }}
              className="w-16 text-center border-x-0 focus:outline-none focus:ring-0 bg-transparent"
              aria-label="Jumlah"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(1)}
              disabled={product.trackQuantity && quantity >= maxStock}
              aria-label="Tambah"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {product.trackQuantity && maxStock > 0 && (
            <span className="text-sm text-muted-foreground">Maks: {maxStock}</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isLoading}
          className="flex-1"
          size="lg"
        >
          {isLoading ? 'Menambahkan...' : isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
          <ShoppingCart className="h-5 w-5 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={handleWishlist}
          className={cn('p-3', inWishlist && 'text-destructive border-destructive')}
          aria-label={inWishlist ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        >
          <Heart className={cn('h-5 w-5', inWishlist && 'fill-current')} />
        </Button>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
        <div className="flex flex-col items-center gap-1">
          <Truck className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Gratis Ongkir</span>
          <span className="text-[10px] text-muted-foreground">Min. Rp 500rb</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Garansi Resmi</span>
          <span className="text-[10px] text-muted-foreground">100% Original</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <RotateCcw className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Retur Mudah</span>
          <span className="text-[10px] text-muted-foreground">7 Hari Gratis</span>
        </div>
      </div>
    </div>
  )
}