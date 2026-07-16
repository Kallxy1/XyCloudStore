'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { generateOrderNumber, formatCurrency } from '@/lib/utils'
import Midtrans from 'midtrans-client'

const checkoutSchema = z.object({
  addressId: z.string().cuid(),
  paymentMethod: z.enum(['MIDTRANS', 'COD', 'BANK_TRANSFER']),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
})

// Initialize Midtrans Snap
const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
})

export async function createOrder(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const rawData = {
    addressId: formData.get('addressId'),
    paymentMethod: formData.get('paymentMethod'),
    couponCode: formData.get('couponCode') || undefined,
    notes: formData.get('notes') || undefined,
  }

  const parsed = checkoutSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid' }
  }

  const { addressId, paymentMethod, couponCode, notes } = parsed.data

  // Get cart with items
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
    return { success: false, error: 'Keranjang kosong' }
  }

  // Get shipping address
  const address = await prisma.address.findUnique({
    where: { id: addressId, userId: session.user.id },
  })

  if (!address) {
    return { success: false, error: 'Alamat tidak ditemukan' }
  }

  // Calculate pricing
  let subtotal = 0
  const orderItems = cart.items.map((item) => {
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
          // Check user usage limit
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
              // free_shipping handled separately
            }
          }
        }
      }
    }
  }

  // Shipping cost
  const shippingCost = coupon?.type === 'free_shipping' ? 0 : 15000 // Default, should come from settings
  const tax = 0 // PPN 11% if needed
  const total = subtotal - discount + shippingCost + tax

  // Create order
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,
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
        items: {
          create: orderItems,
        },
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
        method: paymentMethod,
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
    const snapToken = await createMidtransTransaction({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      user: { email: session.user.email!, name: session.user.name ?? null },
      items: order.items,
    })
    return { success: true, orderId: order.id, snapToken, redirectUrl: `/checkout/success?orderId=${order.id}` }
  }

  if (paymentMethod === 'COD') {
    // COD - order confirmed, payment on delivery
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PENDING' },
    })
    return { success: true, orderId: order.id, redirectUrl: `/checkout/success?orderId=${order.id}` }
  }

  if (paymentMethod === 'BANK_TRANSFER') {
    // Bank transfer - show VA details
    return { success: true, orderId: order.id, redirectUrl: `/checkout/bank-transfer?orderId=${order.id}` }
  }

  return { success: true, orderId: order.id, redirectUrl: `/checkout/success?orderId=${order.id}` }
}

async function createMidtransTransaction(order: { id: string; orderNumber: string; total: number; user: { email: string; name: string | null }; items: { sku: string; price: number; quantity: number; name: string }[] }) {
  const parameter = {
    transaction_details: {
      order_id: order.orderNumber,
      gross_amount: order.total,
    },
    customer_details: {
      email: order.user.email,
      first_name: order.user.name?.split(' ')[0] || 'Customer',
      last_name: order.user.name?.split(' ').slice(1).join(' ') || '',
    },
    item_details: order.items.map((item) => ({
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
  return transaction.token
}

export async function getOrder(orderId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: { include: { images: { take: 1 } } },
          variant: true,
        },
      },
      payments: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  })

  return order
}

export async function getOrders(page = 1, limit = 10) {
  const session = await auth()
  if (!session?.user?.id) return { orders: [], total: 0, pages: 0 }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ])

  return {
    orders,
    total,
    pages: Math.ceil(total / limit),
  }
}

export async function cancelOrder(orderId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { 
      items: {
        include: {
          product: true,
        }
      }, 
      payments: true 
    },
  })

  if (!order) {
    return { success: false, error: 'Pesanan tidak ditemukan' }
  }

  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    return { success: false, error: 'Pesanan tidak dapat dibatalkan' }
  }

  await prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of order.items) {
      if (item.product.trackQuantity) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { quantity: { increment: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          })
        }
      }
    }

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        statusHistory: {
          create: {
            status: 'CANCELLED',
            note: 'Dibatalkan oleh pembeli',
            createdBy: session.user.id,
          },
        },
      },
    })

    // Update payment status
    await tx.payment.updateMany({
      where: { orderId },
      data: { status: 'REFUNDED' },
    })
  })

  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)

  return { success: true, message: 'Pesanan berhasil dibatalkan' }
}