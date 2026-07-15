'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const productSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).optional(),
  description: z.string().min(10),
  shortDesc: z.string().max(200).optional(),
  basePrice: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).optional(),
  costPrice: z.number().int().min(0).optional(),
  sku: z.string().min(3).max(50),
  barcode: z.string().optional(),
  categoryId: z.string().cuid(),
  trackQuantity: z.boolean().default(true),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weight: z.number().int().min(0).optional(),
  length: z.number().int().min(0).optional(),
  width: z.number().int().min(0).optional(),
  height: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  images: z.array(z.string().url()).optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        sku: z.string(),
        price: z.number().int().default(0),
        quantity: z.number().int().min(0).default(0),
        image: z.string().url().optional(),
      })
    )
    .optional(),
})

export async function getProducts({
  page = 1,
  limit = 12,
  category,
  search,
  featured,
  sort = 'newest',
  minPrice,
  maxPrice,
}: {
  page?: number
  limit?: number
  category?: string
  search?: string
  featured?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  minPrice?: number
  maxPrice?: number
} = {}) {
  const where: Record<string, unknown> = {
    isActive: true,
  }

  if (category) {
    where.category = { slug: category }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (featured) {
    where.isFeatured = true
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {}
    if (minPrice !== undefined) where.basePrice.gte = minPrice
    if (maxPrice !== undefined) where.basePrice.lte = maxPrice
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' }
  switch (sort) {
    case 'price_asc':
      orderBy = { basePrice: 'asc' }
      break
    case 'price_desc':
      orderBy = { basePrice: 'desc' }
      break
    case 'popular':
      orderBy = { orderItems: { _count: 'desc' } }
      break
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: true,
        _count: { select: { reviews: true, orderItems: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products: products.map((p) => ({
      ...p,
      price: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      image: p.images[0]?.url || '/placeholder-product.jpg',
      rating: p._count.reviews > 0 ? 4.5 : 0, // Placeholder
      reviewCount: p._count.reviews,
      soldCount: p._count.orderItems,
    })),
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

export async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { createdAt: 'asc' } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true, orderItems: true } },
    },
  })

  if (!product) return null

  return {
    ...product,
    price: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    rating: product._count.reviews > 0 ? 4.5 : 0,
    reviewCount: product._count.reviews,
    soldCount: product._count.orderItems,
  }
}

export async function getFeaturedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return products.map((p) => ({
    ...p,
    price: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    image: p.images[0]?.url || '/placeholder-product.jpg',
  }))
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      id: { not: productId },
      categoryId,
      isActive: true,
    },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return products.map((p) => ({
    ...p,
    price: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    image: p.images[0]?.url || '/placeholder-product.jpg',
  }))
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
      children: { where: { isActive: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return categories
}

export async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug, isActive: true },
    include: {
      children: { where: { isActive: true } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  })
}

// Admin actions
export async function createProduct(data: z.infer<typeof productSchema>) {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid', issues: parsed.error.flatten() }
  }

  const { images, variants, ...productData } = parsed.data
  const slug = productData.slug || slugify(productData.name)

  // Check SKU uniqueness
  const existingSku = await prisma.product.findUnique({ where: { sku: productData.sku } })
  if (existingSku) {
    return { success: false, error: 'SKU sudah digunakan' }
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      slug,
      images: images?.map((url, index) => ({ url, sortOrder: index })) || [],
      variants: variants?.map((v) => ({
        ...v,
        sku: v.sku || `${productData.sku}-${slugify(v.value)}`,
      })) || [],
    },
    include: { images: true, variants: true },
  })

  revalidatePath('/admin/products')
  revalidatePath('/products/[slug]', 'page')

  return { success: true, product }
}

export async function updateProduct(id: string, data: Partial<z.infer<typeof productSchema>>) {
  const parsed = productSchema.partial().safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid', issues: parsed.error.flatten() }
  }

  const { images, variants, slug, ...productData } = parsed.data
  const finalSlug = slug || (data.name ? slugify(data.name) : undefined)

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      slug: finalSlug,
      images: images
        ? {
            deleteMany: {},
            create: images.map((url, index) => ({ url, sortOrder: index })),
          }
        : undefined,
      variants: variants
        ? {
            deleteMany: {},
            create: variants.map((v) => ({
              ...v,
              sku: v.sku || `${productData.sku || 'PROD'}-${slugify(v.value)}`,
            })),
          }
        : undefined,
    },
    include: { images: true, variants: true },
  })

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/products/[slug]', 'page')

  return { success: true, product }
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } })

  revalidatePath('/admin/products')
  revalidatePath('/products/[slug]', 'page')

  return { success: true }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  const product = await prisma.product.update({
    where: { id },
    data: { isActive },
  })

  revalidatePath('/admin/products')
  revalidatePath('/products/[slug]', 'page')

  return { success: true, product }
}