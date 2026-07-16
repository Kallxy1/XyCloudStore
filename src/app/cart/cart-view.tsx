'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Heart, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartItem } from '@/components/cart/cart-item'
import { CartSummary } from '@/components/cart/cart-summary'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface CartViewProps {
  initialCart: {
    items: Array<{
      id: string
      productId: string
      variantId?: string | null
      quantity: number
      product: {
        id: string
        slug: string
        name: string
        basePrice: number
        compareAtPrice?: number | null
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
      subtotal: number
    }>
    total: number
    count: number
  }
}

export function CartView({ initialCart }: CartViewProps) {
  const { items, updateQuantity, removeItem, isLoading, refreshCart } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [shippingCost] = useState(15000)

  // Merge initial cart with client cart
  const cartItems = items.length > 0 ? items : initialCart.items
  
  // Calculate subtotal for each item
  const cartItemsWithSubtotal = cartItems.map(item => ({
    ...item,
    subtotal: (item.product.basePrice + (item.variant?.price || 0)) * item.quantity,
  }))
  
  const subtotal = cartItemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0)
  const total = subtotal - discount + shippingCost

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    setIsApplyingCoupon(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      })
      
      const data = await res.json()
      if (data.success) {
        setDiscount(data.discount)
        setAppliedCoupon(couponCode.trim())
        toast.success(`Kode ${couponCode.trim()} diterapkan! Diskon ${formatCurrency(data.discount)}`)
      } else {
        toast.error(data.error || 'Kode tidak valid')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setDiscount(0)
    setAppliedCoupon(null)
    setCouponCode('')
    toast.success('Kode voucher dihapus')
  }

  const handleCheckout = () => {
    if (cartItemsWithSubtotal.length === 0) return
    window.location.href = '/checkout'
  }

  const handleContinueShopping = () => {
    window.location.href = '/products'
  }

  if (cartItemsWithSubtotal.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <svg className="h-24 w-24 mx-auto text-muted-foreground/50 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="text-2xl font-bold mb-2">Keranjang Kosong</h1>
          <p className="text-muted-foreground mb-6">Belum ada produk di keranjang Anda</p>
          <Link href="/products">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="h-5 w-5" />
              Mulai Belanja
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Keranjang Belanja</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-xl border overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Produk</div>
              <div className="col-span-2 text-center">Harga</div>
              <div className="col-span-2 text-center">Jumlah</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            <div className="divide-y">
              {cartItemsWithSubtotal.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Cart Actions */}
            <div className="p-4 border-t flex items-center justify-between">
              <Button variant="outline" onClick={handleContinueShopping}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Lanjut Belanja
              </Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{cartItemsWithSubtotal.length} item dipilih</span>
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus Semua
                </Button>
              </div>
            </div>
          </div>

          {/* Wishlist / Recently Viewed */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Produk yang Mungkin Anda Suka</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Placeholder for recommended products */}
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Rekomendasi produk akan muncul di sini
              </div>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={subtotal}
            itemCount={cartItemsWithSubtotal.reduce((sum, item) => sum + item.quantity, 0)}
            onCheckout={handleCheckout}
            onContinueShopping={handleContinueShopping}
            shippingCost={shippingCost}
            discount={discount}
            couponCode={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            isApplyingCoupon={isApplyingCoupon}
          />
        </div>
      </div>
    </div>
  )
}

