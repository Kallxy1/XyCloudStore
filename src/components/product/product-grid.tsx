'use client'

import { ProductCard } from './product-card'

interface ProductGridProps {
  products: Array<{
    id: string
    slug: string
    name: string
    price: number
    compareAtPrice?: number | null
    image: string
    isFeatured?: boolean
    quantity: number
    trackQuantity: boolean
  }>
  variant?: 'default' | 'compact' | 'featured'
  columns?: { base: number; sm: number; md: number; lg: number; xl: number }
}

export function ProductGrid({
  products,
  variant = 'default',
  columns = { base: 1, sm: 2, md: 3, lg: 4, xl: 5 },
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="h-16 w-16 text-muted-foreground/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="text-lg font-medium">Produk tidak ditemukan</h3>
        <p className="text-muted-foreground mt-1">Coba ubah filter atau kata kunci pencarian</p>
      </div>
    )
  }

  return (
    <div className={`
      grid gap-4 md:gap-6
      grid-cols-${columns.base}
      sm:grid-cols-${columns.sm}
      md:grid-cols-${columns.md}
      lg:grid-cols-${columns.lg}
      xl:grid-cols-${columns.xl}
    `}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  )
}