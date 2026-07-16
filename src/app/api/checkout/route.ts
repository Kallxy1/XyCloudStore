import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateOrderNumber, formatCurrency } from '@/lib/utils'
import Midtrans from 'midtrans-client'

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const formData = await request.formData()
  const addressId = formData.get('addressId') as string
  const paymentMethod = formData.get('paymentMethod') as string
  const couponCode = formData.get('couponCode') as string | null
  const notes = formData.get('notes') as string | null

  if (!addressId || !paymentMethod) {
    return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 })
  }

  // Get cart
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { include: { variants: true } },
          variant: true,
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ success: false, error: 'Keranjang kosong' }, { status: 400 })
  }

  // Get shipping address
  const address = await prisma.address.findUnique({
    where: { id: addressId, userId: session.user.id },
  })

  if (!address) {
    return NextResponse.json({ success: false, error: 'Alamat tidak ditemukan' }, { status: 404 })
  }

  // Calculate pricing
  let subtotal = 0
  const orderItems = cart.items.map(item => {
    const price = item.product.basePrice + (item.variant?.price || 0)
    const total = price * item.quantity
    subtotal += total
    return {
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      sku: item.variant?.sku || item.product.sku,
      price,
      quantity: item.quantity,
      total,
    }
  })

  // Apply coupon if provided
  let discount = 0
  let coupon = null

  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase(), isActive: true },
    })

    if (coupon) {
      const now = new Date()
      if (coupon.startDate <= now && coupon.endDate >= now) {
        if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
          const userUsage = await prisma.couponUsage.count({
            where: { couponId: coupon.id, userId: session.user.id },
          })

          if (userUsage < coupon.userLimit) {
            if (subtotal >= coupon.minAmount) {
              if (coupon.type === 'percentage') {
                discount = Math.round(subtotal * (coupon.value / 100))
                if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                  discount = coupon.maxDiscount
                }
              } else if (coupon.type === 'fixed_amount') {
                discount = Math.min(coupon.value, subtotal)
              }
            }
          }
        }
      }
    }
  }

  const shippingCost = 15000 // Should come from shipping option
  const tax = 0
  const total = subtotal - discount + shippingCost + tax

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod as any,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        shippingName: address.recipientName,
        shippingPhone: address.phone,
        shippingAddress: address.detail,
        shippingCity: address.city,
        shippingProvince: address.province,
        shippingPostalCode: address.postalCode,
        shippingNotes: notes,
        items: { create: orderItems },
        statusHistory: {
          create: {
            status: 'PENDING',
            note: 'Pesanan dibuat',
            createdBy: session.user.id,
          },
        },
      },
      include: { items: true },
    })

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: total,
        currency: 'IDR',
        method: paymentMethod as any,
        status: 'PENDING',
      },
    })

    // Update coupon usage
    if (coupon && discount > 0) {
      await tx.couponUsage.create({
        data: {
          couponId: coupon.id,
          userId: session.user.id,
          orderId: newOrder.id,
        },
      })
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      })
    }

    // Decrease product stock
    for (const item of cart.items) {
      if (item.product.trackQuantity) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { quantity: { decrement: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          })
        }
      }
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    return newOrder
  })

  // Handle payment based on method
  if (paymentMethod === 'MIDTRANS') {
    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: total,
      },
      customer_details: {
        email: session.user.email!,
        first_name: session.user.name?.split(' ')[0] || 'Customer',
        last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
      },
      item_details: order.items.map(item => ({
        id: item.sku,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${order.id}`,
        error: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?orderId=${order.id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending?orderId=${order.id}`,
      },
      expiry: {
        unit: 'minute',
        duration: 30,
      },
    }

    const transaction = await snap.createTransaction(parameter)
    
    // Update payment with midtrans token
    const payment = await prisma.payment.findFirst({
      where: { orderId: order.id },
    })
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { midtransToken: transaction.token, midtransOrderId: order.orderNumber },
      })
    }

    return NextResponse.json({ 
      success: true, 
      orderId: order.id, 
      snapToken: transaction.token,
      redirectUrl: `/checkout/success?orderId=${order.id}`
    })
  }

  if (paymentMethod === 'COD') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PENDING', paymentStatus: 'PENDING' },
    })
    return NextResponse.json({ 
      success: true, 
      orderId: order.id, 
      redirectUrl: `/checkout/success?orderId=${order.id}`
    })
  }

  if (paymentMethod === 'BANK_TRANSFER') {
    return NextResponse.json({ 
      success: true, 
      orderId: order.id, 
      redirectUrl: `/checkout/bank-transfer?orderId=${order.id}`
    })
  }

  return NextResponse.json({ 
    success: true, 
    orderId: order.id, 
    redirectUrl: `/checkout/success?orderId=${order.id}`
  })
}