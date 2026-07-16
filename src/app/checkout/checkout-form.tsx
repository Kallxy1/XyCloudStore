'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Midtrans Snap types
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess?: () => void
        onPending?: () => void
        onError?: () => void
        onClose?: () => void
      }) => void
    } | undefined
  }
}
import { CreditCard, Truck, Shield, RotateCcw, CheckCircle, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, cn } from '@/lib/utils'
import { createOrder } from '@/lib/actions/checkout'
import { toast } from 'react-hot-toast'

interface CheckoutFormProps {
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
      }
      variant?: {
        id: string
        name: string
        value: string
        price: number
      } | null
      subtotal: number
    }>
    total: number
    count: number
  }
  initialAddresses: Array<{
    id: string
    label: string
    recipientName: string
    phone: string
    province: string
    city: string
    district: string
    village: string
    postalCode: string
    detail: string
    isDefault: boolean
  }>
}

const shippingOptions = [
  { id: 'regular', name: 'Reguler', cost: 15000, eta: '3-5 hari kerja', icon: Truck },
  { id: 'express', name: 'Express', cost: 25000, eta: '1-2 hari kerja', icon: Truck },
  { id: 'same_day', name: 'Same Day', cost: 35000, eta: 'Hari ini (Area Jakarta)', icon: Truck },
]

const paymentMethods = [
  { id: 'MIDTRANS', name: 'Midtrans (VA, E-Wallet, CC)', desc: 'Virtual Account, GoPay, ShopeePay, Kartu Kredit', icon: CreditCard },
  { id: 'COD', name: 'Cash on Delivery (COD)', desc: 'Bayar di tempat saat barang diterima', icon: Shield },
  { id: 'BANK_TRANSFER', name: 'Transfer Bank Manual', desc: 'Transfer ke rekening BCA/Mandiri/BRI', icon: CreditCard },
]

export function CheckoutForm({ initialCart, initialAddresses }: CheckoutFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(initialAddresses.find(a => a.isDefault)?.id || initialAddresses[0]?.id || '')
  const [selectedShipping, setSelectedShipping] = useState('regular')
  const [selectedPayment, setSelectedPayment] = useState('MIDTRANS')
  const [couponCode, setCouponCode] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: 'Rumah',
    recipientName: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postalCode: '',
    detail: '',
    isDefault: false,
  })

  const shippingOption = shippingOptions.find(s => s.id === selectedShipping)!
  const paymentMethod = paymentMethods.find(p => p.id === selectedPayment)!
  const subtotal = initialCart.items.reduce((sum, item) => sum + item.subtotal, 0)
  const shippingCost = shippingOption.cost
  const total = subtotal + shippingCost

  const selectedAddress = initialAddresses.find(a => a.id === selectedAddressId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAddressId) {
      toast.error('Pilih alamat pengiriman')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('addressId', selectedAddressId)
      formData.append('paymentMethod', selectedPayment)
      if (couponCode.trim()) formData.append('couponCode', couponCode.trim())
      if (notes.trim()) formData.append('notes', notes.trim())

      const result = await createOrder(formData)
      
      if (result.success) {
        if (result.snapToken) {
          window.snap?.pay(result.snapToken, {
            onSuccess: () => router.push(`/checkout/success?orderId=${result.orderId}`),
            onPending: () => router.push(`/checkout/pending?orderId=${result.orderId}`),
            onError: () => router.push(`/checkout/error?orderId=${result.orderId}`),
            onClose: () => router.push(`/checkout/pending?orderId=${result.orderId}`),
          })
        } else {
          router.push(result.redirectUrl || `/checkout/success?orderId=${result.orderId}`)
        }
      } else {
        toast.error(result.error || 'Gagal membuat pesanan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    Object.entries(newAddress).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Alamat ditambahkan')
        setShowAddressForm(false)
        setNewAddress({ label: 'Rumah', recipientName: '', phone: '', province: '', city: '', district: '', village: '', postalCode: '', detail: '', isDefault: false })
        router.refresh()
      } else {
        toast.error(data.error || 'Gagal menambah alamat')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="hidden md:flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s, i) => (
          <div key={s} className="flex flex-col items-center relative">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            <span className={cn('text-xs mt-1 font-medium', step >= s ? 'text-foreground' : 'text-muted-foreground')}>
              {['Alamat', 'Pengiriman', 'Pembayaran', 'Review'][i]}
            </span>
            {i < 3 && (
              <div className={cn('absolute top-5 left-1/2 w-full h-0.5 -translate-x-1/2', step > s ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Shipping Address */}
        {(step === 1 || step > 1) && (
          <div className={cn('space-y-6', step !== 1 && 'hidden')}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Alamat Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {initialAddresses.length > 0 && (
                  <div className="space-y-3">
                    {initialAddresses.map(address => (
                      <label
                        key={address.id}
                        className={cn(
                          'flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                          selectedAddressId === address.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        )}
                      >
                        <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                          <RadioGroupItem value={address.id} className="mt-1" />
                        </RadioGroup>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{address.label}</span>
                            {address.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Utama</span>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.recipientName} - {address.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.detail}, {address.village}, {address.district}, {address.city} {address.postalCode}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddressForm(true)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Tambah Alamat Baru
                </Button>
              </CardContent>
            </Card>

            {/* New Address Form Modal */}
            {showAddressForm && (
              <Card className="fixed inset-0 z-50 m-auto max-w-md mt-20 animate-in slide-in-from-top-4">
                <CardHeader>
                  <CardTitle>Tambah Alamat Baru</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateAddress}>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Label" placeholder="Rumah/Kantor" value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} />
                      <Input label="Nama Penerima" value={newAddress.recipientName} onChange={e => setNewAddress({...newAddress, recipientName: e.target.value})} required />
                    </div>
                    <Input label="Nomor Telepon" type="tel" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} required />
                    <div className="grid grid-cols-3 gap-4">
                      <Input label="Provinsi" value={newAddress.province} onChange={e => setNewAddress({...newAddress, province: e.target.value})} required />
                      <Input label="Kota/Kabupaten" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
                      <Input label="Kecamatan" value={newAddress.district} onChange={e => setNewAddress({...newAddress, district: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Kelurahan" value={newAddress.village} onChange={e => setNewAddress({...newAddress, village: e.target.value})} required />
                      <Input label="Kode Pos" value={newAddress.postalCode} onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} required />
                    </div>
                    <Textarea label="Alamat Lengkap" placeholder="Jalan, RT/RW, No. Rumah, dll" value={newAddress.detail} onChange={e => setNewAddress({...newAddress, detail: e.target.value})} required />
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} className="rounded border-input" />
                      Jadikan alamat utama
                    </Label>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Simpan Alamat</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>Batal</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)} className="w-full md:w-auto">
                Lanjut ke Pengiriman <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Shipping Method */}
        {(step === 2 || step > 2) && (
          <div className={cn('space-y-6', step !== 2 && 'hidden')}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Metode Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shippingOptions.map(option => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                      selectedShipping === option.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    )}
                  >
                    <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping}>
                      <RadioGroupItem value={option.id} className="mt-0.5" />
                    </RadioGroup>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <option.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-primary font-semibold">{formatCurrency(option.cost)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Estimasi: {option.eta}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Kembali</Button>
              <Button type="button" onClick={() => setStep(3)}>Lanjut ke Pembayaran <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Method */}
        {(step === 3 || step > 3) && (
          <div className={cn('space-y-6', step !== 3 && 'hidden')}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map(method => (
                  <label
                    key={method.id}
                    className={cn(
                      'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                      selectedPayment === method.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    )}
                  >
                    <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                      <RadioGroupItem value={method.id} className="mt-0.5" />
                    </RadioGroup>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <method.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.desc}</p>
                    </div>
                  </label>
                ))}

                {/* Coupon */}
                <div className="pt-4 border-t">
                  <Label>Kode Voucher (Opsional)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Masukkan kode voucher"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={() => {}}>Cek</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Kembali</Button>
              <Button type="button" onClick={() => setStep(4)}>Lanjut ke Review <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* Step 4: Review Order */}
        {(step === 4) && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Review Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2">Alamat Pengiriman</p>
                  {selectedAddress && (
                    <address className="not-italic text-sm text-muted-foreground">
                      {selectedAddress.recipientName} - {selectedAddress.phone}<br />
                      {selectedAddress.detail}, {selectedAddress.village}, {selectedAddress.district}<br />
                      {selectedAddress.city} {selectedAddress.postalCode}, {selectedAddress.province}
                    </address>
                  )}
                </div>

                {/* Shipping Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2">Metode Pengiriman</p>
                  <p className="text-sm text-muted-foreground">{shippingOption.name} - {formatCurrency(shippingOption.cost)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Estimasi: {shippingOption.eta}</p>
                </div>

                {/* Payment Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2">Metode Pembayaran</p>
                  <p className="text-sm text-muted-foreground">{paymentMethod.name}</p>
                </div>

                {/* Items */}
                <div>
                  <p className="font-medium mb-3">Produk</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {initialCart.items.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <img src={item.product.images[0]?.url || '/placeholder-product.jpg'} alt={item.product.name} className="h-16 w-16 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          {item.variant && <p className="text-xs text-muted-foreground">{item.variant.name}: {item.variant.value}</p>}
                          <p className="text-sm text-primary">{formatCurrency(item.product.basePrice + (item.variant?.price || 0))} x {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <Textarea
                  label="Catatan untuk Penjual (Opsional)"
                  placeholder="Contoh: Tolong dibungkus rapi, kirim hari kerja saja, dll"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({initialCart.count} item)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ongkir ({shippingOption.name})</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Bayar</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1">Kembali</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1" size="lg">
                {isSubmitting ? 'Memproses...' : 'Buat Pesanan & Bayar'}
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Step Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} className="flex-1" disabled={step === 1}>
              Sebelumnya
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1">
                Selanjutnya
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="flex-1" size="lg">
                {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}