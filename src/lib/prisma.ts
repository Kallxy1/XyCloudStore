import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Mock data untuk testing UI tanpa database
const mockProducts = [
  {
    id: '1', slug: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max 256GB',
    description: 'Flagship Apple terbaru dengan chip A17 Pro, kamera 48MP, dan desain titanium.',
    basePrice: 22999000, compareAtPrice: 24999000,
    sku: 'IP15PM-256-NAT', quantity: 50, isActive: true, isFeatured: true,
    categoryId: '1', category: { id: '1', name: 'Elektronik', slug: 'elektronik' },
    images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', alt: 'iPhone 15 Pro Max' }],
    variants: [], _count: { reviews: 124, orderItems: 50 }
  },
  {
    id: '2', slug: 'samsung-galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra 512GB',
    description: 'Android flagship dengan Galaxy AI, kamera 200MP, S Pen terintegrasi.',
    basePrice: 19999000, compareAtPrice: 21999000,
    sku: 'SGS24U-512-TIT', quantity: 40, isActive: true, isFeatured: true,
    categoryId: '1', category: { id: '1', name: 'Elektronik', slug: 'elektronik' },
    images: [{ url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', alt: 'Galaxy S24 Ultra' }],
    variants: [], _count: { reviews: 89, orderItems: 30 }
  },
  {
    id: '3', slug: 'macbook-air-m3', name: 'MacBook Air 13" M3 Chip 8GB/256GB',
    description: 'Laptop ultraportable dengan chip M3, cocok untuk kerja dan kuliah.',
    basePrice: 16499000, compareAtPrice: 17499000,
    sku: 'MBA-M3-256-SGR', quantity: 25, isActive: true, isFeatured: true,
    categoryId: '1', category: { id: '1', name: 'Elektronik', slug: 'elektronik' },
    images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', alt: 'MacBook Air M3' }],
    variants: [], _count: { reviews: 56, orderItems: 15 }
  },
  {
    id: '4', slug: 'nike-air-max-270', name: 'Nike Air Max 270 React',
    description: 'Sneakers nyaman untuk daily wear dengan teknologi Air Max dan React foam.',
    basePrice: 1899000, compareAtPrice: 2299000,
    sku: 'NK-AM270-REA', quantity: 80, isActive: true, isFeatured: true,
    categoryId: '4', category: { id: '4', name: 'Sepatu', slug: 'sepatu' },
    images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', alt: 'Nike Air Max 270' }],
    variants: [
      { id: 'v1', name: 'Ukuran', value: '40', sku: 'NK-AM270-REA-40', price: 0, quantity: 15, image: null },
      { id: 'v2', name: 'Ukuran', value: '41', sku: 'NK-AM270-REA-41', price: 0, quantity: 20, image: null },
      { id: 'v3', name: 'Ukuran', value: '42', sku: 'NK-AM270-REA-42', price: 0, quantity: 20, image: null },
      { id: 'v4', name: 'Ukuran', value: '43', sku: 'NK-AM270-REA-43', price: 0, quantity: 15, image: null }
    ],
    _count: { reviews: 234, orderItems: 100 }
  },
  {
    id: '5', slug: 'adidas-ultraboost-23', name: 'Adidas Ultraboost 23 Running Shoes',
    description: 'Sepatu lari dengan teknologi BOOST terbaru untuk energy return maksimal.',
    basePrice: 2499000, compareAtPrice: 2999000,
    sku: 'AD-UB23-PKN', quantity: 70, isActive: true, isFeatured: true,
    categoryId: '4', category: { id: '4', name: 'Sepatu', slug: 'sepatu' },
    images: [{ url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800', alt: 'Adidas Ultraboost 23' }],
    variants: [
      { id: 'v5', name: 'Ukuran', value: '40', sku: 'AD-UB23-PKN-40', price: 0, quantity: 15, image: null },
      { id: 'v6', name: 'Ukuran', value: '41', sku: 'AD-UB23-PKN-41', price: 0, quantity: 20, image: null },
      { id: 'v7', name: 'Ukuran', value: '42', sku: 'AD-UB23-PKN-42', price: 0, quantity: 20, image: null }
    ],
    _count: { reviews: 189, orderItems: 80 }
  },
  {
    id: '6', slug: 'kaos-polo-premium', name: 'Kaos Polo Premium Cotton Combed 30s',
    description: 'Kaos polo bahan cotton combed 30s yang lembut, nyaman, dan tahan lama.',
    basePrice: 189000, compareAtPrice: 249000,
    sku: 'KP-PREM-30S', quantity: 200, isActive: true, isFeatured: false,
    categoryId: '2', category: { id: '2', name: 'Pakaian Pria', slug: 'pakaian-pria' },
    images: [{ url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800', alt: 'Kaos Polo Premium' }],
    variants: [
      { id: 'v8', name: 'Warna', value: 'Hitam', sku: 'KP-PREM-30S-BLK', price: 0, quantity: 50, image: null },
      { id: 'v9', name: 'Warna', value: 'Navy', sku: 'KP-PREM-30S-NVY', price: 0, quantity: 45, image: null },
      { id: 'v10', name: 'Warna', value: 'Putih', sku: 'KP-PREM-30S-WHT', price: 0, quantity: 40, image: null }
    ],
    _count: { reviews: 456, orderItems: 200 }
  }
]

const mockCategories = [
  { id: '1', name: 'Elektronik', slug: 'elektronik', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', _count: { products: 15 } },
  { id: '2', name: 'Pakaian Pria', slug: 'pakaian-pria', image: 'https://images.unsplash.com/photo-1617127365699-c47faeb3e2ec?w=400', _count: { products: 12 } },
  { id: '3', name: 'Pakaian Wanita', slug: 'pakaian-wanita', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', _count: { products: 10 } },
  { id: '4', name: 'Sepatu & Aksesoris', slug: 'sepatu', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', _count: { products: 8 } },
  { id: '5', name: 'Rumah Tangga', slug: 'rumah-tangga', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', _count: { products: 6 } }
]

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper untuk fallback ke mock data saat DB tidak tersedia
export async function withMockFallback<T>(fn: () => Promise<T>, mockData: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.warn('DB unavailable, using mock data:', error)
    return mockData
  }
}

// Mock functions untuk server actions
export const mockGetProducts = async ({ 
  page = 1, 
  limit = 12, 
  category, 
  search, 
  featured, 
  sort = 'newest' 
}: { 
  page?: number; limit?: number; category?: string; search?: string; featured?: boolean; sort?: string 
} = {}) => {
  let filtered = [...mockProducts]
  
  if (category) filtered = filtered.filter(p => p.categoryId === category || p.category?.slug === category)
  if (featured) filtered = filtered.filter(p => p.isFeatured)
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.description.toLowerCase().includes(s)
    )
  }
  
  if (sort === 'price_asc') filtered.sort((a, b) => a.basePrice - b.basePrice)
  else if (sort === 'price_desc') filtered.sort((a, b) => b.basePrice - a.basePrice)
  else if (sort === 'popular') filtered.sort((a, b) => b._count.orderItems - a._count.orderItems)
  
  const start = (page - 1) * limit
  const paginated = filtered.slice(start, start + limit)
  
  return {
    products: paginated.map(p => ({
      ...p, 
      price: p.basePrice, 
      compareAtPrice: p.compareAtPrice,
      image: p.images[0]?.url,
      rating: 4.5,
      reviewCount: p._count.reviews,
      soldCount: p._count.orderItems
    })),
    total: filtered.length,
    pages: Math.ceil(filtered.length / limit),
    currentPage: page
  }
}

export const mockGetCategories = async () => mockCategories

export const mockGetFeaturedProducts = async (limit = 8) => 
  mockProducts.filter(p => p.isFeatured).slice(0, limit).map(p => ({
    ...p, price: p.basePrice, compareAtPrice: p.compareAtPrice, image: p.images[0]?.url
  }))

export const mockGetProduct = async (slug: string) => 
  mockProducts.find(p => p.slug === slug) ? {
    ...mockProducts.find(p => p.slug === slug)!,
    price: mockProducts.find(p => p.slug === slug)!.basePrice,
    compareAtPrice: mockProducts.find(p => p.slug === slug)!.compareAtPrice,
    rating: 4.5,
    reviewCount: mockProducts.find(p => p.slug === slug)!.reviews?.length || 0,
    soldCount: mockProducts.find(p => p.slug === slug)!.orderItems?.length || 0
  } : null

export const mockGetRelatedProducts = async (productId: string, categoryId: string, limit = 4) =>
  mockProducts
    .filter(p => p.id !== productId && p.categoryId === categoryId)
    .slice(0, limit)
    .map(p => ({ ...p, price: p.basePrice, compareAtPrice: p.compareAtPrice, image: p.images[0]?.url }))