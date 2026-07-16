'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getWishlist() {
  const session = await auth()
  if (!session?.user?.id) return { items: [], count: 0 }

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

  if (!wishlist) return { items: [], count: 0 }

  const items = wishlist.items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: item.product.basePrice,
      compareAtPrice: item.product.compareAtPrice,
      image: item.product.images[0]?.url || '/placeholder-product.jpg',
    },
  }))

  return { items, count: items.length }
}

export async function addToWishlist(productId: string, variantId?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  })

  if (!product) {
    return { success: false, error: 'Produk tidak ditemukan' }
  }

  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
  })

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: session.user.id },
    })
  }

  const existing = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId,
      variantId: variantId ?? null,
    },
  })

  if (existing) {
    return { success: false, error: 'Produk sudah ada di wishlist' }
  }

  await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId,
      variantId: variantId ?? null,
    },
  })

  revalidatePath('/wishlist')
  revalidatePath(`/products/${product.slug}`)

  return { success: true, message: 'Ditambahkan ke wishlist' }
}

export async function removeFromWishlist(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const item = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: { wishlist: true },
  })

  if (!item || item.wishlist.userId !== session.user.id) {
    return { success: false, error: 'Item tidak ditemukan' }
  }

  await prisma.wishlistItem.delete({ where: { id: itemId } })

  revalidatePath('/wishlist')

  return { success: true }
}

export async function moveToCart(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const item = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: { wishlist: true, product: true, variant: true },
  })

  if (!item || item.wishlist.userId !== session.user.id) {
    return { success: false, error: 'Item tidak ditemukan' }
  }

  // Add to cart
  let cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: session.user.id },
    })
  }

  const existingCartItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
    },
  })

  if (existingCartItem) {
    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: existingCartItem.quantity + 1 },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: 1,
      },
    })
  }

  // Remove from wishlist
  await prisma.wishlistItem.delete({ where: { id: itemId } })

  revalidatePath('/wishlist')
  revalidatePath('/cart')

  return { success: true, message: 'Dipindahkan ke keranjang' }
}

export async function clearWishlist() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
  })

  if (wishlist) {
    await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } })
  }

  revalidatePath('/wishlist')

  return { success: true }
}