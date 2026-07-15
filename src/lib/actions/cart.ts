'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const addToCartSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().min(1).max(99),
})

const updateCartSchema = z.object({
  itemId: z.string().cuid(),
  quantity: z.number().int().min(0).max(99),
})

export async function getCart() {
  const session = await auth()
  if (!session?.user?.id) return { items: [], total: 0, count: 0 }

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

  if (!cart) return { items: [], total: 0, count: 0 }

  const items = cart.items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: item.product.basePrice,
      image: item.product.images[0]?.url || '/placeholder-product.jpg',
    },
    variant: item.variant
      ? { ...item.variant, price: item.variant.price }
      : null,
    subtotal:
      (item.product.basePrice + (item.variant?.price || 0)) * item.quantity,
  }))

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  return { items, total, count }
}

export async function addToCart(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const rawData = {
    productId: formData.get('productId'),
    variantId: formData.get('variantId') || undefined,
    quantity: parseInt(formData.get('quantity') as string) || 1,
  }

  const parsed = addToCartSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid' }
  }

  const { productId, variantId, quantity } = parsed.data

  // Check product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    include: { variants: true },
  })

  if (!product) {
    return { success: false, error: 'Produk tidak ditemukan' }
  }

  // Check variant if provided
  let variant = null
  if (variantId) {
    variant = await prisma.productVariant.findUnique({
      where: { id: variantId, productId },
    })
    if (!variant) {
      return { success: false, error: 'Varian tidak ditemukan' }
    }
  }

  // Check stock
  const availableStock = variant?.quantity ?? product.quantity
  if (product.trackQuantity && availableStock < quantity) {
    return { success: false, error: 'Stok tidak mencukupi' }
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: session.user.id },
    })
  }

  // Check if item already in cart
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
      return { success: false, error: 'Stok tidak mencukupi' }
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

  revalidatePath('/cart')
  revalidatePath('/products/[slug]', 'page')

  return { success: true, message: 'Produk ditambahkan ke keranjang' }
}

export async function updateCartQuantity(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const rawData = {
    itemId: formData.get('itemId'),
    quantity: parseInt(formData.get('quantity') as string) || 0,
  }

  const parsed = updateCartSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid' }
  }

  const { itemId, quantity } = parsed.data

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true, variant: true },
  })

  if (!cartItem || cartItem.cart.userId !== session.user.id) {
    return { success: false, error: 'Item tidak ditemukan' }
  }

  // Check stock
  const availableStock = cartItem.variant?.quantity ?? cartItem.product.quantity
  if (cartItem.product.trackQuantity && availableStock < quantity) {
    return { success: false, error: 'Stok tidak mencukupi' }
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } })
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })
  }

  revalidatePath('/cart')

  return { success: true }
}

export async function removeFromCart(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })

  if (!cartItem || cartItem.cart.userId !== session.user.id) {
    return { success: false, error: 'Item tidak ditemukan' }
  }

  await prisma.cartItem.delete({ where: { id: itemId } })

  revalidatePath('/cart')

  return { success: true }
}

export async function clearCart() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  })

  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  revalidatePath('/cart')

  return { success: true }
}