'use client'

import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

interface CartSummaryProps {
  subtotal: number
  itemCount: number
  onCheckout: () => void
  onContinueShopping: () => void
  shippingCost?: number
  discount?: number
  couponCode?: string | null
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
  isApplyingCoupon?: boolean
}

export function CartSummary({
  subtotal,
  itemCount,
  onCheckout,
  onContinueShopping,
  shippingCost = 15000,
  discount = 0,
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
}: CartSummaryProps) {
  const total = subtotal - discount + shippingCost
  const freeShippingThreshold = 500000
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)

  return (
    <div className="sticky top-24 space-y-6">
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal ({itemCount} item)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Ongkir</span>
            {shippingCost === 0 ? (
              <span className="text-green-600 font-medium">Gratis</span>
            ) : (
              <span>{formatCurrency(shippingCost)}</span>
            )}
          </div>

          <div className="border-t pt-3 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Free Shipping Progress */}
        {shippingCost > 0 && subtotal < freeShippingThreshold && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Tambah <strong>{formatCurrency(remainingForFreeShipping)}</strong> lagi untuk Gratis Ongkir
            </p>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(subtotal / freeShippingThreshold) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Coupon */}
        <div className="mt-4">
          {couponCode ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-medium text-green-800">
                Kode: {couponCode} diterapkan
              </span>
              <Button variant="ghost" size="sm" onClick={onRemoveCoupon}>
                Hapus
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const code = formData.get('coupon') as string
                if (code.trim()) onApplyCoupon(code.trim())
              }}
              className="flex gap-2"
            >
              <Input
                name="coupon"
                placeholder="Kode voucher"
                className="flex-1"
                disabled={isApplyingCoupon}
              />
              <Button type="submit" disabled={isApplyingCoupon} size="sm">
                {isApplyingCoupon ? 'Menerapkan...' : 'Gunakan'}
              </Button>
            </form>
          )}
        </div>

        <Button onClick={onCheckout} className="w-full mt-4" size="lg">
          Lanjut ke Checkout
        </Button>

        <Button variant="outline" onClick={onContinueShopping} className="w-full mt-2">
          Lanjut Belanja
        </Button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
          <Truck className="h-6 w-6 mx-auto text-primary mb-2" />
          <p className="text-xs font-medium">Pengiriman Cepat</p>
          <p className="text-[10px] text-muted-foreground">Dikirim hari ini</p>
        </div>
        <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
          <Shield className="h-6 w-6 mx-auto text-primary mb-2" />
          <p className="text-xs font-medium">Garansi Resmi</p>
          <p className="text-[10px] text-muted-foreground">Produk original 100%</p>
        </div>
        <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
          <RotateCcw className="h-6 w-6 mx-auto text-primary mb-2" />
          <p className="text-xs font-medium">Retur Mudah</p>
          <p className="text-[10px] text-muted-foreground">7 hari retur gratis</p>
        </div>
        <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
          <Headphones className="h-6 w-6 mx-auto text-primary mb-2" />
          <p className="text-xs font-medium">Dukungan 24/7</p>
          <p className="text-[10px] text-muted-foreground">Live chat & telepon</p>
        </div>
      </div>
    </div>
  )
}