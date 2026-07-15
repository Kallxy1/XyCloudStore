import { auth } from '@/lib/auth'
import { prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

// This is a mock - in real implementation, import from '@/lib/prisma'
const mockPrisma = {
  review: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  },
  order: {
    findFirst: async () => null,
  },
}

export async function GET(request: Request) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!productId) {
    return NextResponse.json({ success: false, error: 'Product ID diperlukan' }, { status: 400 })
  }

  const [reviews, total] = await Promise.all([
    mockPrisma.review.findMany({
      where: { productId, isApproved: true },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    mockPrisma.review.count({ where: { productId, isApproved: true } }),
  ])

  return NextResponse.json({
    reviews,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const formData = await request.formData()
  const productId = formData.get('productId') as string
  const orderId = formData.get('orderId') as string | null
  const rating = parseInt(formData.get('rating') as string)
  const title = formData.get('title') as string | null
  const content = formData.get('content') as string
  const images = formData.getAll('images') as string[]

  if (!productId || !rating || !content) {
    return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: 'Rating harus antara 1-5' }, { status: 400 })
  }

  // Check if user already reviewed
  const existing = await mockPrisma.review.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  })

  if (existing) {
    return NextResponse.json({ success: false, error: 'Anda sudah mereview produk ini' }, { status: 400 })
  }

  // Verify purchase if orderId provided
  let isVerified = false
  if (orderId) {
    const order = await mockPrisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: { in: ['DELIVERED', 'SHIPPED'] },
        items: { some: { productId } },
      },
    })
    isVerified = !!order
  }

  await mockPrisma.review.create({
    data: {
      userId: session.user.id,
      productId,
      orderId,
      rating,
      title,
      content,
      images: images || [],
      isVerified,
    },
  })

  return NextResponse.json({ success: true, message: 'Review berhasil dikirim' })
}