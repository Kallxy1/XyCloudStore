'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const reviewSchema = z.object({
  productId: z.string().cuid(),
  orderId: z.string().cuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(10).max(2000),
  images: z.array(z.string().url()).optional(),
})

export async function getProductReviews(productId: string, page = 1, limit = 10) {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isApproved: true },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { productId, isApproved: true } }),
  ])

  // Calculate rating distribution
  const allReviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  })

  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
    percentage:
      allReviews.length > 0
        ? Math.round((allReviews.filter((r) => r.rating === star).length / allReviews.length) * 100)
        : 0,
  }))

  const averageRating =
    allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

  return {
    reviews,
    total,
    pages: Math.ceil(total / limit),
    averageRating: Math.round(averageRating * 10) / 10,
    distribution,
  }
}

export async function createReview(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const rawData = {
    productId: formData.get('productId'),
    orderId: formData.get('orderId') || undefined,
    rating: parseInt(formData.get('rating') as string),
    title: formData.get('title') || undefined,
    content: formData.get('content'),
    images: formData.getAll('images') as string[],
  }

  const parsed = reviewSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid', issues: parsed.error.flatten() }
  }

  const { productId, orderId, rating, title, content, images } = parsed.data

  // Check if user already reviewed this product
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  })

  if (existing) {
    return { success: false, error: 'Anda sudah mereview produk ini' }
  }

  // Verify purchase if orderId provided
  let isVerified = false
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: { in: ['DELIVERED', 'SHIPPED'] },
        items: { some: { productId } },
      },
    })
    isVerified = !!order
  }

  await prisma.review.create({
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

  revalidatePath(`/products/[slug]`, 'page')

  return { success: true, message: 'Review berhasil dikirim' }
}

export async function updateReview(reviewId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId: session.user.id },
  })

  if (!review) {
    return { success: false, error: 'Review tidak ditemukan' }
  }

  const rawData = {
    rating: parseInt(formData.get('rating') as string),
    title: formData.get('title') || undefined,
    content: formData.get('content'),
    images: formData.getAll('images') as string[],
  }

  const parsed = reviewSchema.partial().safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid', issues: parsed.error.flatten() }
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: parsed.data,
  })

  revalidatePath(`/products/[slug]`, 'page')
  revalidatePath('/account/reviews')

  return { success: true, message: 'Review berhasil diperbarui' }
}

export async function deleteReview(reviewId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId: session.user.id },
  })

  if (!review) {
    return { success: false, error: 'Review tidak ditemukan' }
  }

  await prisma.review.delete({ where: { id: reviewId } })

  revalidatePath(`/products/[slug]`, 'page')
  revalidatePath('/account/reviews')

  return { success: true, message: 'Review berhasil dihapus' }
}

export async function getUserReviews() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.review.findMany({
    where: { userId: session.user.id },
    include: {
      product: { include: { images: { take: 1 } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}