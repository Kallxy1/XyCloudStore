import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ items: [], total: 0, count: 0 })
  }

  const cart = await prisma.cart.findUnique({
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

  if (!cart) {
    return NextResponse.json({ items: [], total: 0, count: 0 })
  }

  const items = cart.items.map(item => ({
    ...item,
    product: {
      ...item.product,
      price: item.product.basePrice,
      image: item.product.images[0]?.url || '/placeholder-product.jpg',
    },
    variant: item.variant ? { ...item.variant, price: item.variant.price } : null,
    subtotal: (item.product.basePrice + (item.variant?.price || 0)) * item.quantity,
  }))

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  return NextResponse.json({ items, total, count })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const formData = await request.formData()
  const productId = formData.get('productId') as string
  const variantId = formData.get('variantId') as string | null
  const quantity = parseInt(formData.get('quantity') as string) || 1

  if (!productId) {
    return NextResponse.json({ success: false, error: 'Product ID diperlukan' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    include: { variants: true },
  })

  if (!product) {
    return NextResponse.json({ success: false, error: 'Produk tidak ditemukan' }, { status: 404 })
  }

  let variant = null
  if (variantId) {
    variant = await prisma.productVariant.findUnique({
      where: { id: variantId, productId },
    })
    if (!variant) {
      return NextResponse.json({ success: false, error: 'Varian tidak ditemukan' }, { status: 404 })
    }
  }

  const availableStock = variant?.quantity ?? product.quantity
  if (product.trackQuantity && availableStock < quantity) {
    return NextResponse.json({ success: false, error: 'Stok tidak mencukupi' }, { status: 400 })
  }

  let cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: session.user.id },
    })
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    },
  })

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity
    if (product.trackQuantity && availableStock < newQuantity) {
      return NextResponse.json({ success: false, error: 'Stok tidak mencukupi' }, { status: 400 })
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
      },
    })
  }

  return NextResponse.json({ success: true, message: 'Produk ditambahkan ke keranjang' })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const formData = await request.formData()
  const itemId = formData.get('itemId') as string
  const quantity = parseInt(formData.get('quantity') as string) || 0

  if (!itemId) {
    return NextResponse.json({ success: false, error: 'Item ID diperlukan' }, { status: 400 })
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true, variant: true, cart: true },
  })

  if (!cartItem || cartItem.cart.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Item tidak ditemukan' }, { status: 404 })
  }

  const availableStock = cartItem.variant?.quantity ?? cartItem.product.quantity
  if (cartItem.product.trackQuantity && availableStock < quantity) {
    return NextResponse.json({ success: false, error: 'Stok tidak mencukupi' }, { status: 400 })
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } })
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })
  }

  return NextResponse.json({ success: true })
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
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    })

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Item tidak ditemukan' }, { status: 404 })
    }

    await prisma.cartItem.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } else {
    // Clear entire cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }

    return NextResponse.json({ success: true })
  }
}