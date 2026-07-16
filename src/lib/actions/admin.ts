'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { formatCurrency } from '@/lib/utils'

const orderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
  courier: z.string().optional(),
})

export async function getDashboardStats() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    totalUsers,
    recentOrders,
    lowStockProducts,
    pendingOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true, trackQuantity: true, quantity: { lte: 10 } },
      take: 10,
      orderBy: { quantity: 'asc' },
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
  ])

  // Monthly revenue for chart
  const monthlyRevenue = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      SUM("total") as revenue
    FROM "Order"
    WHERE "paymentStatus" = 'PAID'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month DESC
    LIMIT 12
  ` as { month: Date; revenue: bigint }[]

  return {
    success: true,
    stats: {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      totalProducts,
      totalUsers,
      pendingOrders,
    },
    recentOrders,
    lowStockProducts,
    monthlyRevenue: monthlyRevenue.map((m) => ({
      month: m.month.toISOString().slice(0, 7),
      revenue: Number(m.revenue),
    })).reverse(),
  }
}

export async function getAdminOrders({
  page = 1,
  limit = 20,
  status,
  search,
}: {
  page?: number
  limit?: number
  status?: string
  search?: string
} = {}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const where: Record<string, unknown> = {}

  if (status && status !== 'ALL') {
    where.status = status
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { include: { images: { take: 1 } } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    success: true,
    orders,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

export async function getAdminOrder(orderId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { include: { images: { take: 1 } } },
          variant: true,
        },
      },
      payments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) {
    return { success: false, error: 'Pesanan tidak ditemukan' }
  }

  return { success: true, order }
}

export async function updateOrderStatus(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const rawData = {
    orderId: formData.get('orderId'),
    status: formData.get('status'),
    note: formData.get('note') || undefined,
    trackingNumber: formData.get('trackingNumber') || undefined,
    courier: formData.get('courier') || undefined,
  }

  const parsed = orderStatusSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid' }
  }

  const { orderId, status, note, trackingNumber, courier } = parsed.data

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    return { success: false, error: 'Pesanan tidak ditemukan' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        trackingNumber: trackingNumber || order.trackingNumber,
        courier: courier || order.courier,
        shippedAt: status === 'SHIPPED' ? new Date() : order.shippedAt,
        deliveredAt: status === 'DELIVERED' ? new Date() : order.deliveredAt,
        statusHistory: {
          create: {
            status,
            note: note || `Status diubah menjadi ${status}`,
            createdBy: session.user.id,
          },
        },
      },
    })

    // Update payment status if needed
    if (status === 'DELIVERED') {
      await tx.payment.updateMany({
        where: { orderId, status: { not: 'PAID' } },
        data: { status: 'PAID', paidAt: new Date() },
      })
    }
  })

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)

  return { success: true, message: 'Status pesanan diperbarui' }
}

export async function getAdminUsers(page = 1, limit = 20) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        _count: { select: { orders: true, addresses: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where: { role: 'USER' } }),
  ])

  return { success: true, users, total, pages: Math.ceil(total / limit) }
}

export async function getAdminSettings() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const settings = await prisma.setting.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  })

  return { success: true, settings }
}

export async function updateSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const entries = Array.from(formData.entries())
  const updates = entries.map(([key, value]) =>
    prisma.setting.update({
      where: { key },
      data: { value: value as string },
    })
  )

  await Promise.all(updates)

  revalidatePath('/admin/settings')

  return { success: true, message: 'Pengaturan disimpan' }
}