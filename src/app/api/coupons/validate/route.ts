import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  try {
    const { code, subtotal } = await request.json()

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ success: false, error: 'Parameter tidak valid' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase(), isActive: true },
    })

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Kode voucher tidak ditemukan' }, { status: 404 })
    }

    const now = new Date()
    if (coupon.startDate > now || coupon.endDate < now) {
      return NextResponse.json({ success: false, error: 'Kode voucher sudah kadaluarsa atau belum aktif' }, { status: 400 })
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ success: false, error: 'Kode voucher sudah habis digunakan' }, { status: 400 })
    }

    // Check user usage limit
    const userUsage = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId: session.user.id },
    })

    if (userUsage >= coupon.userLimit) {
      return NextResponse.json({ success: false, error: 'Anda sudah mencapai batas penggunaan kode ini' }, { status: 400 })
    }

    if (subtotal < coupon.minAmount) {
      return NextResponse.json({ 
        success: false, 
        error: `Minimal belanja ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(coupon.minAmount)}` 
      }, { status: 400 })
    }

    // Check if coupon applies to specific categories/products
    if (coupon.appliesTo !== 'all' && coupon.targetIds.length > 0) {
      // This would require checking cart items against coupon targets
      // For simplicity, we'll skip this check here and do it at order creation
    }

    let discount = 0
    if (coupon.type === 'percentage') {
      discount = Math.round(subtotal * (coupon.value / 100))
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
    } else if (coupon.type === 'fixed_amount') {
      discount = Math.min(coupon.value, subtotal)
    } else if (coupon.type === 'free_shipping') {
      // Handled separately in checkout
      discount = 0
    }

    return NextResponse.json({ 
      success: true, 
      discount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
      }
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 })
  }
}