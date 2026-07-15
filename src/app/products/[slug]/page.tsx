import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Star, Truck, Shield, RotateCcw, CheckCircle, Minus, Plus, Heart, Share2, Truck as TruckIcon, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductGallery } from '@/components/product/product-gallery'
import { getProduct, getRelatedProducts } from '@/lib/actions/products'
import { formatCurrency, cn } from '@/lib/utils'
import { AddToCartForm } from './add-to-cart-form'
import { ProductReviews } from './product-reviews'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) {
    return { title: 'Produk Tidak Ditemukan' }
  }

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDesc || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDesc || product.description.slice(0, 160),
      images: product.images.map(img => img.url),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.shortDesc || product.description.slice(0, 160),
      images: product.images.map(img => img.url),
    },
    other: {
      'product:price:amount': product.basePrice.toString(),
      'product:price:currency': 'IDR',
      'product:availability': product.trackQuantity && product.quantity <= 0 ? 'out of stock' : 'in stock',
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) notFound()

  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4)
  
  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const isOutOfStock = product.trackQuantity && product.quantity <= 0
  const isLowStock = product.trackQuantity && product.quantity > 0 && product.quantity <= 5

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Beranda</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Produk</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-foreground transition-colors">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]" aria-current="page">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Gallery */}
        <div className="space-y-4">
          <ProductGallery
            images={product.images.map(img => ({ url: img.url, alt: img.alt || product.name }))}
          />

          {/* Product Badges */}
          <div className="flex flex-wrap gap-2">
            {discountPercent > 0 && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Hemat {discountPercent}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Star className="h-3 w-3 mr-1" /> Unggulan
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning" className="text-sm px-3 py-1">
                Sisa {product.quantity} item
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Stok Habis
              </Badge>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            {[
              { icon: TruckIcon, label: 'Gratis Ongkir', desc: 'Min. belanja Rp 500rb' },
              { icon: Shield, label: 'Garansi Resmi', desc: '100% Original' },
              { icon: RotateCcw, label: 'Retur 7 Hari', desc: 'Gratis & Mudah' },
              { icon: CheckCircle, label: 'Pembayaran Aman', desc: 'SSL & Enkripsi' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                <item.icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-primary font-medium">{product.category.name}</p>
            <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold">{product.rating || 5}</span>
              <span className="text-muted-foreground">({product.reviewCount || 0} ulasan)</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">{product.soldCount || 0} terjual</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xl text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.shortDesc && (
            <p className="text-muted-foreground border-y py-4">{product.shortDesc}</p>
          )}

          {/* Add to Cart Form */}
          <AddToCartForm product={product} />

          {/* Quantity Selector (fallback for non-JS) */}
          <noscript>
            <div className="flex items-center gap-4">
              <label htmlFor="quantity" className="font-medium">Jumlah:</label>
              <Input id="quantity" name="quantity" type="number" min="1" max={product.quantity} defaultValue={1} className="w-24" />
            </div>
          </noscript>

          {/* Product Meta */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>Dikirim dari <strong>{product.category.name}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <TruckIcon className="h-5 w-5 text-muted-foreground" />
              <span>Berat: <strong>{product.weight ? `${(product.weight / 1000).toFixed(1)} kg` : '-'}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <span>SKU: <strong>{product.sku}</strong></span>
            </div>
          </div>

          {/* Share */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Bagikan:</span>
            <button className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Bagikan ke Facebook">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Bagikan ke Twitter">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Bagikan ke WhatsApp">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A11.914 11.914 0 0012 0C5.373 0 0 5.373 0 12c0 2.17.586 4.21 1.603 5.994L0 24l6.302-1.653A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12 0-1.91-.46-3.71-1.274-5.354zM8 16.32c-.75.23-1.54.24-2.31.04l-1.32-.39-.49 1.34c.13.42.25.86.39 1.3.37.96 1.16 1.84 2.13 2.13.44.14.88.26 1.3.39l1.34-.49-.39-1.32c-.2-.77-.19-1.56-.04-2.31-.45-2.18-.5-4.92-.05-7.23 1.6-8.13 7.9-13.85 15.05-13.85 3.7 0 6.89 1.74 9.07 4.5 3.2 4.02 3.3 9.62.9 13.07-.3.44-.68.82-1.1.95-.4.13-.83.05-1.12-.24-1.47-.7-2.68-1.85-3.5-3.32-2.34-4.19-1.46-9.63 1.67-12.77z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Deskripsi</TabsTrigger>
            <TabsTrigger value="specs">Spesifikasi</TabsTrigger>
            <TabsTrigger value="reviews">Ulasan ({product.reviewCount || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          </TabsContent>

          <TabsContent value="specs" className="mt-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <dt className="text-sm text-muted-foreground">Nama Produk</dt>
                <dd className="font-medium">{product.name}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm text-muted-foreground">SKU</dt>
                <dd className="font-medium">{product.sku}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm text-muted-foreground">Kategori</dt>
                <dd className="font-medium">{product.category.name}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm text-muted-foreground">Harga</dt>
                <dd className="font-medium text-primary">{formatCurrency(product.price)}</dd>
              </div>
              {product.weight && (
                <div className="flex flex-col">
                  <dt className="text-sm text-muted-foreground">Berat</dt>
                  <dd className="font-medium">{(product.weight / 1000).toFixed(2)} kg</dd>
                </div>
              )}
              {product.length && product.width && product.height && (
                <div className="flex flex-col">
                  <dt className="text-sm text-muted-foreground">Dimensi</dt>
                  <dd className="font-medium">{product.length} x {product.width} x {product.height} cm</dd>
                </div>
              )}
              <div className="flex flex-col">
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd className="font-medium">{isOutOfStock ? 'Stok Habis' : isLowStock ? `Sisa ${product.quantity}` : 'Tersedia'}</dd>
              </div>
            </dl>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ProductReviews productId={product.id} initialReviews={product.reviews} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Produk Terkait</h2>
          <ProductGrid
            products={relatedProducts}
            variant="default"
            columns={{ base: 1, sm: 2, md: 4, lg: 4 }}
          />
        </section>
      )}
    </div>
  )
}