import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShoppingCart, Truck, Shield, RotateCcw, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductGrid } from '@/components/product/product-grid'
import { getFeaturedProducts, getCategories, getProducts } from '@/lib/actions/products'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Belanja Online Terpercaya',
  description: 'Belanja online aman dan nyaman di TokoKita. Produk berkualitas, harga terjangkau, pengiriman cepat ke seluruh Indonesia.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [featuredProducts, categories, flashSaleProducts] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getProducts({ featured: true, limit: 4, sort: 'popular' }),
  ])

  const stats = [
    { label: 'Pelanggan Puas', value: '50.000+', icon: Star },
    { label: 'Produk Tersedia', value: '1.200+', icon: ShoppingCart },
    { label: 'Pengiriman Cepat', value: '24 Jam', icon: Truck },
    { label: 'Garansi Resmi', value: '100%', icon: Shield },
  ]

  const features = [
    { icon: Truck, title: 'Pengiriman Cepat', desc: 'Dikirim hari kerja yang sama untuk pesanan sebelum jam 12 siang' },
    { icon: Shield, title: 'Produk Original', desc: '100% asli bergaransi resmi, uang kembali 100% jika palsu' },
    { icon: RotateCcw, title: 'Retur Mudah', desc: '7 hari retur gratis tanpa ribet, proses cepat & transparan' },
    { icon: Star, title: 'Harga Terbaik', desc: 'Harga kompetitif langsung dari distributor resmi' },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-4 text-sm">
                🔥 Flash Sale Hari Ini - Diskon hingga 50%
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Belanja Online <span className="text-primary">Lebih Mudah</span> & Terpercaya
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Jutaan produk berkualitas dengan harga terbaik. Pengiriman cepat ke seluruh Indonesia,
                pembayaran aman, dan retur mudah 7 hari.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    Mulai Belanja
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button size="lg" variant="outline">
                    Lihat Kategori
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/3] max-w-lg mx-auto">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800"
                  alt="Belanja online di TokoKita"
                  fill
                  className="object-cover rounded-2xl shadow-2xl"
                  priority
                />
                <div className="absolute -bottom-6 -left-6 bg-background/95 backdrop-blur p-4 rounded-xl shadow-xl border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">4.9/5 Rating</p>
                      <p className="text-sm text-muted-foreground">10.000+ ulasan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="container mx-auto px-4 mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 md:p-6">
                <stat.icon className="h-10 w-10 mx-auto text-primary mb-3" />
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-10 w-10 mx-auto text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Kategori Populer</h2>
              <p className="text-muted-foreground mt-1">Temukan produk yang Anda butuhkan</p>
            </div>
            <Link href="/categories" className="hidden md:inline-flex items-center gap-2 text-primary hover:underline">
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={category.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400'}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-white">{category.name}</h3>
                  <p className="text-sm text-white/80">{category._count?.products || 0} produk</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      {flashSaleProducts.products.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <span className="relative">
                    ⚡ Flash Sale
                    <span className="absolute -top-2 right-8 animate-ping bg-destructive text-white text-xs px-1.5 rounded">
                      HOT
                    </span>
                  </span>
                </h2>
                <p className="text-muted-foreground mt-1">Diskon terbatas, stok terbatas!</p>
              </div>
              <Link href="/promo" className="text-primary hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <ProductGrid products={flashSaleProducts.products} variant="default" columns={{ base: 1, sm: 2, md: 4, lg: 4, xl: 5 }} />
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Produk Unggulan</h2>
              <p className="text-muted-foreground mt-1">Pilihan terbaik untuk Anda</p>
            </div>
            <Link href="/products?featured=true" className="hidden md:inline-flex items-center gap-2 text-primary hover:underline">
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ProductGrid products={featuredProducts} variant="default" columns={{ base: 1, sm: 2, md: 4, lg: 4, xl: 5 }} />
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Dapatkan Penawaran Eksklusif</h2>
          <p className="text-primary-foreground/80 mb-6">
            Daftar newsletter kami untuk mendapat info promo, produk baru, dan diskon khusus sebelum orang lain.
          </p>
          <form action="/api/newsletter" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              name="email"
              placeholder="Masukkan email Anda"
              required
              className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-foreground focus:border-transparent text-primary-foreground placeholder-primary-foreground/50"
            />
            <Button type="submit" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              Berlangganan
            </Button>
          </form>
          <p className="text-xs text-primary-foreground/60 mt-3">
            Dengan berlangganan, Anda menyetujui Kebijakan Privasi kami. Tidak ada spam, bisa unsubscribe kapan saja.
          </p>
        </div>
      </section>
    </div>
  )
}