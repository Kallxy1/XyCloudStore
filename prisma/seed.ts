import { PrismaClient, Role, OrderStatus, PaymentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================================
  // CREATE ADMIN USER
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // ============================================
  // CREATE TEST USER
  // ============================================
  const userPassword = await bcrypt.hash('user123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'user@store.com' },
    update: {},
    create: {
      email: 'user@store.com',
      name: 'Test User',
      password: userPassword,
      role: Role.USER,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Test user created:', testUser.email)

  // ============================================
  // CREATE CATEGORIES
  // ============================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'elektronik' },
      update: {},
      create: {
        name: 'Elektronik',
        slug: 'elektronik',
        description: 'Produk elektronik terbaru dan terlengkap',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pakaian-pria' },
      update: {},
      create: {
        name: 'Pakaian Pria',
        slug: 'pakaian-pria',
        description: 'Koleksi pakaian pria modern dan trendy',
        image: 'https://images.unsplash.com/photo-1617127365699-c47faeb3e2ec?w=400',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pakaian-wanita' },
      update: {},
      create: {
        name: 'Pakaian Wanita',
        slug: 'pakaian-wanita',
        description: 'Koleksi pakaian wanita elegan dan kasual',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sepatu' },
      update: {},
      create: {
        name: 'Sepatu & Aksesoris',
        slug: 'sepatu',
        description: 'Sepatu sneakers, formal, dan aksesoris fashion',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'rumah-tangga' },
      update: {},
      create: {
        name: 'Rumah Tangga',
        slug: 'rumah-tangga',
        description: 'Peralatan rumah tangga dan dekorasi',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        sortOrder: 5,
      },
    }),
  ])
  console.log('✅ Categories created:', categories.length)

  // ============================================
  // CREATE PRODUCTS
  // ============================================
  const electronicsCat = categories.find(c => c.slug === 'elektronik')!
  const mensClothingCat = categories.find(c => c.slug === 'pakaian-pria')!
  const womensClothingCat = categories.find(c => c.slug === 'pakaian-wanita')!
  const shoesCat = categories.find(c => c.slug === 'sepatu')!
  const homeCat = categories.find(c => c.slug === 'rumah-tangga')!

  const products = await Promise.all([
    // Electronics
    prisma.product.upsert({
      where: { slug: 'iphone-15-pro-max' },
      update: {},
      create: {
        name: 'iPhone 15 Pro Max 256GB',
        slug: 'iphone-15-pro-max',
        description: `iPhone 15 Pro Max hadir dengan chip A17 Pro yang powerful, kamera 48MP dengan sistem kamera Pro yang revolusioner, dan desain titanium yang ringan namun kuat. Dynamic Island memberikan pengalaman interaksi baru yang intuitif.`,
        shortDesc: 'Flagship smartphone Apple terbaru dengan chip A17 Pro dan kamera 48MP',
        basePrice: 22999000, // 22.999.000 IDR
        compareAtPrice: 24999000,
        sku: 'IP15PM-256-NAT',
        barcode: '194253405123',
        trackQuantity: true,
        quantity: 50,
        lowStockThreshold: 5,
        weight: 221,
        isActive: true,
        isFeatured: true,
        categoryId: electronicsCat.id,
        metaTitle: 'iPhone 15 Pro Max 256GB - Harga Terbaik',
        metaDescription: 'Beli iPhone 15 Pro Max 256GB original garansi resmi. Harga terbaik, cicilan 0%, pengiriman cepat.',
      },
    }),
    prisma.product.upsert({
      where: { slug: 'samsung-galaxy-s24-ultra' },
      update: {},
      create: {
        name: 'Samsung Galaxy S24 Ultra 512GB',
        slug: 'samsung-galaxy-s24-ultra',
        description: `Galaxy S24 Ultra dilengkapi Galaxy AI yang mengubah cara Anda berkomunikasi, berkreasi, dan bekerja. Kamera 200MP dengan Space Zoom 100x, S Pen terintegrasi, dan layar Dynamic AMOLED 2X 6.8" QHD+.`,
        shortDesc: 'Smartphone Android flagship dengan Galaxy AI dan kamera 200MP',
        basePrice: 19999000,
        compareAtPrice: 21999000,
        sku: 'SGS24U-512-TIT',
        barcode: '8806095345678',
        trackQuantity: true,
        quantity: 40,
        lowStockThreshold: 5,
        weight: 232,
        isActive: true,
        isFeatured: true,
        categoryId: electronicsCat.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'macbook-air-m3' },
      update: {},
      create: {
        name: 'MacBook Air 13" M3 Chip 8GB/256GB',
        slug: 'macbook-air-m3',
        description: `MacBook Air dengan chip M3 membawa performa super cepat ke desain tipis dan ringan. Layar Liquid Retina 13.6", hingga 18 jam baterai, dan sistem operasi macOS yang powerful untuk pekerjaan dan kreasi.`,
        shortDesc: 'Laptop ultraportable dengan chip M3, cocok untuk kerja dan kuliah',
        basePrice: 16499000,
        compareAtPrice: 17499000,
        sku: 'MBA-M3-256-SGR',
        barcode: '194253406789',
        trackQuantity: true,
        quantity: 25,
        lowStockThreshold: 3,
        weight: 1240,
        isActive: true,
        isFeatured: true,
        categoryId: electronicsCat.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'sony-wh-1000xm5' },
      update: {},
      create: {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        slug: 'sony-wh-1000xm5',
        description: `Headphone noise cancelling terbaik di kelasnya dengan processor Integrated Processor V1, 8 mikrofon, dan kualitas suara High-Resolution Audio. Baterai tahan 30 jam dengan ANC aktif.`,
        shortDesc: 'Noise cancelling headphone terbaik dengan kualitas audio premium',
        basePrice: 4999000,
        compareAtPrice: 5999000,
        sku: 'WH1000XM5-BLK',
        barcode: '4548736134567',
        trackQuantity: true,
        quantity: 100,
        lowStockThreshold: 10,
        weight: 250,
        isActive: true,
        isFeatured: true,
        categoryId: electronicsCat.id,
      },
    }),

    // Men's Clothing
    prisma.product.upsert({
      where: { slug: 'kaos-polo-premium' },
      update: {},
      create: {
        name: 'Kaos Polo Premium Cotton Combed 30s',
        slug: 'kaos-polo-premium',
        description: `Kaos polo premium bahan cotton combed 30s yang lembut, nyaman, dan tahan lama. Cocok untuk casual daily wear maupun semi-formal. Tersedia berbagai warna classic.`,
        shortDesc: 'Kaos polo bahan premium, nyaman dipakai seharian penuh',
        basePrice: 189000,
        compareAtPrice: 249000,
        sku: 'KP-PREM-30S',
        barcode: '8999991234567',
        trackQuantity: true,
        quantity: 200,
        lowStockThreshold: 20,
        weight: 180,
        isActive: true,
        isFeatured: false,
        categoryId: mensClothingCat.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'kemeja-formal-slimfit' },
      update: {},
      create: {
        name: 'Kemeja Formal Slim Fit Non-Iron',
        slug: 'kemeja-formal-slimfit',
        description: `Kemeja formal slim fit dengan teknologi non-iron, bahan TC (Tetoron Cotton) premium yang anti-kusut. Desain modern dengan potongan slim yang nyaman untuk aktivitas kantor seharian.`,
        shortDesc: 'Kemeja kantor anti-kusut, slim fit modern',
        basePrice: 259000,
        compareAtPrice: 329000,
        sku: 'KF-SF-NI',
        barcode: '8999991234574',
        trackQuantity: true,
        quantity: 150,
        lowStockThreshold: 15,
        weight: 220,
        isActive: true,
        isFeatured: true,
        categoryId: mensClothingCat.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'celana-chino-stretch' },
      update: {},
      create: {
        name: 'Celana Chino Stretch 4-Way',
        slug: 'celana-chino-stretch',
        description: `Celana chino dengan bahan stretch 4-way yang memberikan kebebasan gerak maksimal. Desain modern tapered fit, cocok untuk kantor maupun santai. Tersedia warna Navy, Black, Khaki, Olive.`,
        shortDesc: 'Celana chino stretch nyaman, cocok kerja & santai',
        basePrice: 229000,
        compareAtPrice: 299000,
        sku: 'CC-STRETCH-4W',
        barcode: '8999991234581',
        trackQuantity: true,
        quantity: 180,
        lowStockThreshold: 15,
        weight: 300,
        isActive: true,
        isFeatured: false,
        categoryId: mensClothingCat.id,
      },
    }),

    // Women's Clothing
    prisma.product.upsert({
      where: { slug: 'dress-floral-midi' },
      update: {},
      create: {
        name: 'Dress Floral Midi Chiffon Premium',
        slug: 'dress-floral-midi',
        description: `Dress midi dengan motif floral elegan, bahan chiffon premium yang flowy dan tidak transparan. Desain dengan kerah V, lengan balon, dan pinggang smocking yang nyaman. Cocok untuk acara formal maupun kasual.`,
        shortDesc: 'Dress midi floral elegan, bahan chiffon premium',
        basePrice: 329000,
        compareAtPrice: 429000,
        sku: 'DF-MIDI-CHF',
        barcode: '8999992345678',
        trackQuantity: true,
        quantity: 120,
        lowStockThreshold: 10,
        weight: 250,
        isActive: true,
        isFeatured: true,
        categoryId: womensClothingCat.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'blouse-satin-peplum' },
      update: {},
      create: {
        name: 'Blouse Satin Peplum Office Wear',
        slug: 'blouse-satin-peplum',
        description: `Blouse satin dengan desain peplum yang feminine dan profesional. Bahan satin premium yang tidak licin berlebihan, nyaman untuk aktivitas kantor seharian. Tersedia warna Putih, Navy, Emerald, Blush Pink.`,
        shortDesc: 'Blouse satin peplum professional untuk kantor',
        basePrice: 199000,
        compareAtPrice: 259000,
        sku: 'BS-PEP-SAT',
        barcode: '8999992345685',
        trackQuantity: true,
        quantity: 150,
        lowStockThreshold: 15,
        weight: 180,
        isActive: true,
        isFeatured: false,
        categoryId: womensClothingCat.id,
      },
    }),

    // Shoes
    prisma.product.upsert({
      where: { slug: 'nike-air-max-270' },
      update: {},
      create: {
        name: 'Nike Air Max 270 React',
        slug: 'nike-air-max-270',
        description: `Nike Air Max 270 React menggabungkan unit Air Max 270 yang ikonik dengan teknologi React foam untuk kenyamanan maksimal. Desain modern dengan upper mesh yang breathable. Cocok untuk lari santai maupun daily wear.`,
        shortDesc: 'Sneakers Nike dengan Air Max 270 & React foam',
        basePrice: 1899000,
        compareAtPrice: 2299000,
        sku: 'NK-AM270-REA',
        barcode: '194253407890',
        trackQuantity: true,
        quantity: 80,
        lowStockThreshold: 8,
        weight: 950,
        isActive: true,
        isFeatured: true,
        categoryId: shoesCat.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'adidas-ultraboost-23' },
      update: {},
      create: {
        name: 'Adidas Ultraboost 23 Running Shoes',
        slug: 'adidas-ultraboost-23',
        description: `Ultraboost 23 hadir dengan BOOST yang lebih responsif, sistem LEP 2.0 untuk transisi mulus, dan upper Primeknit+ yang adaptive. Dirancang untuk runner yang menginginkan energy return maksimal.`,
        shortDesc: 'Sepatu lari Adidas dengan teknologi BOOST terbaru',
        basePrice: 2499000,
        compareAtPrice: 2999000,
        sku: 'AD-UB23-PKN',
        barcode: '4064056789012',
        trackQuantity: true,
        quantity: 70,
        lowStockThreshold: 7,
        weight: 980,
        isActive: true,
        isFeatured: true,
        categoryId: shoesCat.id,
      },
    }),

    // Home
    prisma.product.upsert({
      where: { slug: 'dyson-v15-detect' },
      update: {},
      create: {
        name: 'Dyson V15 Detect Absolute Vacuum',
        slug: 'dyson-v15-detect',
        description: `Vacuum nirkabel paling powerful Dyson dengan laser detect yang mengungkap debu mikroskopik. LCD screen menampilkan bukti real-time apa yang tersedot. Baterai tahan 60 menit, cocok untuk rumah tangga modern.`,
        shortDesc: 'Vacuum nirkabel Dyson terkuat dengan laser detect',
        basePrice: 8999000,
        compareAtPrice: 9999000,
        sku: 'DY-V15-DET',
        barcode: '5025155067890',
        trackQuantity: true,
        quantity: 30,
        lowStockThreshold: 3,
        weight: 3200,
        isActive: true,
        isFeatured: true,
        categoryId: homeCat.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'philips-airfryer-5000' },
      update: {},
      create: {
        name: 'Philips Airfryer Series 5000 XL 6.2L',
        slug: 'philips-airfryer-5000',
        description: `Airfryer dengan teknologi Rapid Air yang memasak makanan renyah di luar dan lembut di dalam dengan minyak hingga 90% lebih sedikit. Kapasitas 6.2L cocok untuk keluarga, 13 fungsi memasak, dan aplikasi NutriU untuk resep.`,
        shortDesc: 'Air fryer XL 6.2L dengan 13 fungsi memasak',
        basePrice: 2799000,
        compareAtPrice: 3499000,
        sku: 'PH-AF5000-XL',
        barcode: '8710103987654',
        trackQuantity: true,
        quantity: 60,
        lowStockThreshold: 6,
        weight: 5800,
        isActive: true,
        isFeatured: false,
        categoryId: homeCat.id,
      },
    }),
  ])
  console.log('✅ Products created:', products.length)

  // ============================================
  // CREATE PRODUCT VARIANTS
  // ============================================
  const poloShirt = products.find(p => p.slug === 'kaos-polo-premium')!
  const chinoPants = products.find(p => p.slug === 'celana-chino-stretch')!
  const nikeShoes = products.find(p => p.slug === 'nike-air-max-270')!

  await Promise.all([
    // Polo variants - Colors
    prisma.productVariant.createMany({
      data: [
        { name: 'Warna', value: 'Hitam', sku: 'KP-PREM-30S-BLK', price: 0, quantity: 50, productId: poloShirt.id },
        { name: 'Warna', value: 'Navy', sku: 'KP-PREM-30S-NVY', price: 0, quantity: 45, productId: poloShirt.id },
        { name: 'Warna', value: 'Putih', sku: 'KP-PREM-30S-WHT', price: 0, quantity: 40, productId: poloShirt.id },
        { name: 'Warna', value: 'Abu-abu', sku: 'KP-PREM-30S-GRY', price: 0, quantity: 35, productId: poloShirt.id },
        { name: 'Warna', value: 'Maroon', sku: 'KP-PREM-30S-MRN', price: 0, quantity: 30, productId: poloShirt.id },
      ],
      skipDuplicates: true,
    }),
    // Chino variants - Size
    prisma.productVariant.createMany({
      data: [
        { name: 'Ukuran', value: '28', sku: 'CC-STRETCH-4W-28', price: 0, quantity: 30, productId: chinoPants.id },
        { name: 'Ukuran', value: '30', sku: 'CC-STRETCH-4W-30', price: 0, quantity: 40, productId: chinoPants.id },
        { name: 'Ukuran', value: '32', sku: 'CC-STRETCH-4W-32', price: 0, quantity: 45, productId: chinoPants.id },
        { name: 'Ukuran', value: '34', sku: 'CC-STRETCH-4W-34', price: 0, quantity: 35, productId: chinoPants.id },
        { name: 'Ukuran', value: '36', sku: 'CC-STRETCH-4W-36', price: 0, quantity: 20, productId: chinoPants.id },
        { name: 'Ukuran', value: '38', sku: 'CC-STRETCH-4W-38', price: 0, quantity: 10, productId: chinoPants.id },
      ],
      skipDuplicates: true,
    }),
    // Nike shoes variants - Size
    prisma.productVariant.createMany({
      data: [
        { name: 'Ukuran', value: '39', sku: 'NK-AM270-REA-39', price: 0, quantity: 15, productId: nikeShoes.id },
        { name: 'Ukuran', value: '40', sku: 'NK-AM270-REA-40', price: 0, quantity: 20, productId: nikeShoes.id },
        { name: 'Ukuran', value: '41', sku: 'NK-AM270-REA-41', price: 0, quantity: 20, productId: nikeShoes.id },
        { name: 'Ukuran', value: '42', sku: 'NK-AM270-REA-42', price: 0, quantity: 15, productId: nikeShoes.id },
        { name: 'Ukuran', value: '43', sku: 'NK-AM270-REA-43', price: 0, quantity: 10, productId: nikeShoes.id },
        { name: 'Ukuran', value: '44', sku: 'NK-AM270-REA-44', price: 0, quantity: 5, productId: nikeShoes.id },
      ],
      skipDuplicates: true,
    }),
  ])
  console.log('✅ Product variants created')

  // ============================================
  // CREATE PRODUCT IMAGES
  // ============================================
  const productImages = [
    { productSlug: 'iphone-15-pro-max', images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
      'https://images.unsplash.com/photo-1695048133072-2b0b5c3e8c4d?w=800',
      'https://images.unsplash.com/photo-1695048133182-3c1c6d4e9f5e?w=800',
    ]},
    { productSlug: 'samsung-galaxy-s24-ultra', images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800',
    ]},
    { productSlug: 'macbook-air-m3', images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
    ]},
    { productSlug: 'sony-wh-1000xm5', images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
    ]},
    { productSlug: 'kaos-polo-premium', images: [
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800',
    ]},
    { productSlug: 'kemeja-formal-slimfit', images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
    ]},
    { productSlug: 'celana-chino-stretch', images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    ]},
    { productSlug: 'dress-floral-midi', images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    ]},
    { productSlug: 'blouse-satin-peplum', images: [
      'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800',
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800',
    ]},
    { productSlug: 'nike-air-max-270', images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800',
    ]},
    { productSlug: 'adidas-ultraboost-23', images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
    ]},
    { productSlug: 'dyson-v15-detect', images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    ]},
    { productSlug: 'philips-airfryer-5000', images: [
      'https://images.unsplash.com/photo-1588512462621-87932f8c3432?w=800',
      'https://images.unsplash.com/photo-1588512462621-87932f8c3432?w=800',
    ]},
  ]

  for (const { productSlug, images } of productImages) {
    const product = products.find(p => p.slug === productSlug)
    if (product) {
      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.upsert({
          where: { id: `${product.id}-img-${i}` },
          update: {},
          create: {
            id: `${product.id}-img-${i}`,
            productId: product.id,
            url: images[i],
            alt: `${product.name} - Image ${i + 1}`,
            sortOrder: i,
          },
        })
      }
    }
  }
  console.log('✅ Product images created')

  // ============================================
  // CREATE SETTINGS
  // ============================================
  const settings = [
    // General
    { key: 'store_name', value: 'TokoKita', type: 'string', group: 'general', label: 'Nama Toko', isPublic: true },
    { key: 'store_description', value: 'Toko online terpercaya dengan produk berkualitas', type: 'string', group: 'general', label: 'Deskripsi Toko', isPublic: true },
    { key: 'store_email', value: 'hello@tokokita.com', type: 'string', group: 'general', label: 'Email Toko', isPublic: true },
    { key: 'store_phone', value: '021-12345678', type: 'string', group: 'general', label: 'Telepon Toko', isPublic: true },
    { key: 'store_address', value: 'Jl. Sudirman No. 123, Jakarta Pusat', type: 'string', group: 'general', label: 'Alamat Toko', isPublic: true },
    { key: 'currency', value: 'IDR', type: 'string', group: 'general', label: 'Mata Uang', isPublic: true },
    { key: 'currency_symbol', value: 'Rp', type: 'string', group: 'general', label: 'Simbol Mata Uang', isPublic: true },
    { key: 'currency_format', value: 'Rp {amount}', type: 'string', group: 'general', label: 'Format Mata Uang', isPublic: true },
    
    // Shipping
    { key: 'shipping_free_threshold', value: '500000', type: 'number', group: 'shipping', label: 'Minimal Belanja Gratis Ongkir', isPublic: true },
    { key: 'shipping_default_cost', value: '15000', type: 'number', group: 'shipping', label: 'Biaya Ongkir Default', isPublic: true },
    { key: 'shipping_same_day_cost', value: '25000', type: 'number', group: 'shipping', label: 'Biaya Same Day Delivery', isPublic: true },
    { key: 'shipping_couriers', value: '["JNE", "J&T", "Sicepat", "AnterAja", "Ninja Xpress"]', type: 'json', group: 'shipping', label: 'Kurir Tersedia', isPublic: true },
    
    // Payment
    { key: 'midtrans_enabled', value: 'true', type: 'boolean', group: 'payment', label: 'Aktifkan Midtrans', isPublic: false },
    { key: 'midtrans_environment', value: 'sandbox', type: 'string', group: 'payment', label: 'Environment Midtrans', isPublic: false },
    { key: 'cod_enabled', value: 'true', type: 'boolean', group: 'payment', label: 'Aktifkan COD', isPublic: true },
    { key: 'bank_transfer_enabled', value: 'true', type: 'boolean', group: 'payment', label: 'Aktifkan Bank Transfer', isPublic: true },
    { key: 'bank_accounts', value: '[{"bank":"BCA","account_number":"1234567890","account_name":"TokoKita"},{"bank":"Mandiri","account_number":"0987654321","account_name":"TokoKita"}]', type: 'json', group: 'payment', label: 'Rekening Bank', isPublic: true },
    
    // Email
    { key: 'email_from', value: 'TokoKita <noreply@tokokita.com>', type: 'string', group: 'email', label: 'Pengirim Email', isPublic: false },
    { key: 'email_order_confirmation', value: 'true', type: 'boolean', group: 'email', label: 'Kirim Konfirmasi Pesanan', isPublic: false },
    { key: 'email_shipping_notification', value: 'true', type: 'boolean', group: 'email', label: 'Kirim Notifikasi Pengiriman', isPublic: false },
    
    // SEO
    { key: 'seo_title', value: 'TokoKita - Belanja Online Terpercaya', type: 'string', group: 'seo', label: 'SEO Title', isPublic: true },
    { key: 'seo_description', value: 'Belanja online aman dan nyaman di TokoKita. Produk berkualitas, harga terjangkau, pengiriman cepat.', type: 'string', group: 'seo', label: 'SEO Description', isPublic: true },
    { key: 'seo_keywords', value: 'belanja online, toko online, e-commerce, indonesia', type: 'string', group: 'seo', label: 'SEO Keywords', isPublic: true },
    { key: 'og_image', value: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200', type: 'string', group: 'seo', label: 'Open Graph Image', isPublic: true },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('✅ Settings created:', settings.length)

  // ============================================
  // CREATE COUPONS
  // ============================================
  await Promise.all([
    prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        name: 'Welcome Discount 10%',
        description: 'Diskon 10% untuk pelanggan baru, minimal belanja Rp 100.000',
        type: 'percentage',
        value: 10,
        minAmount: 100000,
        maxDiscount: 50000,
        usageLimit: 1000,
        userLimit: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        appliesTo: 'all',
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'FREESHIP' },
      update: {},
      create: {
        code: 'FREESHIP',
        name: 'Gratis Ongkir',
        description: 'Gratis ongkir untuk minimal belanja Rp 250.000',
        type: 'free_shipping',
        value: 0,
        minAmount: 250000,
        usageLimit: 5000,
        userLimit: 5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        appliesTo: 'all',
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'FLASH20' },
      update: {},
      create: {
        code: 'FLASH20',
        name: 'Flash Sale 20%',
        description: 'Diskon 20% untuk produk elektronik, maksimal Rp 500.000',
        type: 'percentage',
        value: 20,
        minAmount: 200000,
        maxDiscount: 500000,
        usageLimit: 100,
        userLimit: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        isActive: true,
        appliesTo: 'categories',
        targetIds: [electronicsCat.id],
      },
    }),
  ])
  console.log('✅ Coupons created')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })