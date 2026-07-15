import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ items: [], count: 0 })
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              variants: true,
            },
          },
          variant: true,
        },
      },
    },
  })

  if (!wishlist) {
    return NextResponse.json({ items: [], count: 0 })
  }

  const items = wishlist.items.map(item => ({
    ...item,
    product: {
      ...item.product,
      price: item.product.basePrice,
      compareAtPrice: item.product.compareAtPrice,
      image: item.product.images[0]?.url || '/placeholder-product.jpg',
    },
  }))

  return NextResponse.json({ items, count: items.length })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const formData = await request.formData()
  const productId = formData.get('productId') as string
  const variantId = formData.get('variantId') as string | null

  if (!productId) {
    return NextResponse.json({ success: false, error: 'Product ID diperlukan' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  })

  if (!product) {
    return NextResponse.json({ success: false, error: 'Produk tidak ditemukan' }, { status: 404 })
  }

  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
  })

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: session.user.id },
    })
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId_variantId: {
        wishlistId: wishlist.id,
        productId,
        variantId: variantId || null,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ success: false, error: 'Produk sudah ada di wishlist' }, { status: 400 })
  }

  await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId,
      variantId: variantId || null,
    },
  })

  return NextResponse.json({ success: true, message: 'Ditambahkan ke wishlist' })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')

  if (itemId) {
    // Delete specific item
    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: { wishlist: true },
    })

    if (!item || item.wishlist.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Item tidak ditemukan' }, { status: 404 })
    }

    await prisma.wishlistItem.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } else {
    // Clear entire wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
    })

    if (wishlist) {
      await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } })
    }

    return NextResponse.json({ success: true })
  }
}