import { Metadata } from 'next'
import { Sidebar, ChevronDown, ChevronUp, Filter, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductGrid } from '@/components/product/product-grid'
import { getProducts, getCategories } from '@/lib/actions/products'
import { formatCurrency } from '@/lib/utils'

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string
    category?: string
    search?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    featured?: string
  }>
}

export const metadata: Metadata = {
  title: 'Semua Produk',
  description: 'Temukan ribuan produk berkualitas dengan harga terbaik di TokoKita.',
}

const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'popular', label: 'Terlaris' },
]

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const category = params.category
  const search = params.search
  const sort = (params.sort as 'newest' | 'price_asc' | 'price_desc' | 'popular') || 'newest'
  const minPrice = params.minPrice ? parseInt(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : undefined
  const featured = params.featured === 'true'

  const [productsData, categories] = await Promise.all([
    getProducts({ page, category, search, sort, minPrice, maxPrice, featured, limit: 20 }),
    getCategories(),
  ])

  const activeFilters = [
    category && `Kategori: ${categories.find(c => c.slug === category)?.name || category}`,
    search && `Pencarian: "${search}"`,
    minPrice && `Min: ${formatCurrency(minPrice)}`,
    maxPrice && `Max: ${formatCurrency(maxPrice)}`,
    featured && 'Produk Unggulan',
  ].filter(Boolean)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Semua Produk</h1>
        <p className="text-muted-foreground mt-1">
          {productsData.total} produk ditemukan
          {activeFilters.length > 0 && ` (${activeFilters.join(', ')})`}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Search */}
            <form action="/products" method="GET" className="space-y-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium mb-2">
                  Cari Produk
                </label>
                <Input
                  id="search"
                  name="search"
                  placeholder="Cari nama produk..."
                  value={search}
                  className="w-full"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Kategori
                </label>
                <Select name="category" value={category || 'all'} onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name} ({cat._count?.products || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Harga</label>
                <div className="flex gap-2">
                  <Input
                    name="minPrice"
                    type="number"
                    placeholder="Min"
                    value={minPrice || ''}
                    className="w-[70px]"
                    min="0"
                    step="1000"
                  />
                  <span className="flex items-center text-muted-foreground">-</span>
                  <Input
                    name="maxPrice"
                    type="number"
                    placeholder="Max"
                    value={maxPrice || ''}
                    className="w-[70px]"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium mb-2">
                  Urutkan
                </label>
                <Select name="sort" value={sort} onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  name="featured"
                  checked={featured}
                  onCheckedChange={() => {}}
                />
                <label htmlFor="featured" className="text-sm">
                  Hanya Produk Unggulan
                </label>
              </div>

              {/* Submit & Clear */}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Terapkan</Button>
                {activeFilters.length > 0 && (
                  <a href="/products" className="flex-1">
                    <Button type="button" variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Hapus Filter
                    </Button>
                  </a>
                )}
              </div>
            </form>
          </div>
        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Button variant="outline" className="w-full gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Desktop Sort & View */}
          <div className="hidden lg:flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Menampilkan {productsData.products.length} dari {productsData.total} produk
            </p>
            <div className="flex items-center gap-4">
              <Select value={sort} onValueChange={() => {}}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products */}
          <ProductGrid
            products={productsData.products}
            variant="default"
            columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
          />

          {/* Pagination */}
          {productsData.pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <a
                  href={`/products?${new URLSearchParams({ ...params, page: (page - 1).toString() })}`}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  Sebelumnya
                </a>
              )}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, productsData.pages) }, (_, i) => {
                  let pageNum = i + 1
                  if (productsData.pages > 5) {
                    if (page > 3 && page < productsData.pages - 2) {
                      pageNum = page - 3 + i
                    } else if (page >= productsData.pages - 2) {
                      pageNum = productsData.pages - 4 + i
                    }
                  }
                  return (
                    <a
                      key={pageNum}
                      href={`/products?${new URLSearchParams({ ...params, page: pageNum.toString() })}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                        pageNum === page
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {pageNum}
                    </a>
                  )
                })}
              </div>
              {page < productsData.pages && (
                <a
                  href={`/products?${new URLSearchParams({ ...params, page: (page + 1).toString() })}`}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  Selanjutnya
                </a>
              )}
            </nav>
          )}

          {productsData.products.length === 0 && productsData.total === 0 && (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground/50 animate-spin mb-4" />
              <h3 className="text-lg font-medium">Tidak ada produk ditemukan</h3>
              <p className="text-muted-foreground mt-1">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}