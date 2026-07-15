'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId: string
  variantId?: string | null
  quantity: number
  product: {
    id: string
    slug: string
    name: string
    basePrice: number
    compareAtPrice?: number | null
    images: Array<{ url: string }>
    trackQuantity: boolean
    quantity: number
  }
  variant?: {
    id: string
    name: string
    value: string
    price: number
    quantity: number
    image?: string | null
  } | null
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  itemCount: number
  subtotal: number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/cart')
          if (res.ok) {
            const data = await res.json()
            set({ items: data.items || [] })
          }
        } catch (error) {
          console.error('Failed to fetch cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      addToCart: async (productId, quantity, variantId) => {
        set({ isLoading: true })
        try {
          const formData = new FormData()
          formData.append('productId', productId)
          formData.append('quantity', quantity.toString())
          if (variantId) formData.append('variantId', variantId)

          const res = await fetch('/api/cart', {
            method: 'POST',
            body: formData,
          })

          const data = await res.json()
          if (data.success) {
            toast.success(data.message || 'Ditambahkan ke keranjang')
            get().fetchCart()
          } else {
            toast.error(data.error || 'Gagal menambahkan ke keranjang')
          }
        } catch (error) {
          toast.error('Terjadi kesalahan')
        } finally {
          set({ isLoading: false })
        }
      },

      updateQuantity: async (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId)
          return
        }

        set({ isLoading: true })
        try {
          const formData = new FormData()
          formData.append('itemId', itemId)
          formData.append('quantity', quantity.toString())

          const res = await fetch('/api/cart', {
            method: 'PATCH',
            body: formData,
          })

          const data = await res.json()
          if (data.success) {
            get().fetchCart()
          } else {
            toast.error(data.error || 'Gagal memperbarui keranjang')
          }
        } catch (error) {
          toast.error('Terjadi kesalahan')
        } finally {
          set({ isLoading: false })
        }
      },

      removeItem: async (itemId) => {
        set({ isLoading: true })
        try {
          const res = await fetch(`/api/cart/${itemId}`, {
            method: 'DELETE',
          })

          const data = await res.json()
          if (data.success) {
            toast.success('Dihapus dari keranjang')
            get().fetchCart()
          } else {
            toast.error(data.error || 'Gagal menghapus item')
          }
        } catch (error) {
          toast.error('Terjadi kesalahan')
        } finally {
          set({ isLoading: false })
        }
      },

      clearCart: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/cart', {
            method: 'DELETE',
          })

          const data = await res.json()
          if (data.success) {
            set({ items: [] })
          }
        } catch (error) {
          console.error('Failed to clear cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      get subtotal() {
        return get().items.reduce((sum, item) => {
          const price = item.product.basePrice + (item.variant?.price || 0)
          return sum + price * item.quantity
        }, 0)
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

// Hook for components to use
export function useCart() {
  const {
    items,
    isLoading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
  } = useCartStore()

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  return {
    items,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
    refreshCart: fetchCart,
  }
}

// Server-side cart data fetcher (for initial load)
export async function getServerCart() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart`, {
      headers: { Cookie: '' }, // Will be handled by NextAuth
      cache: 'no-store',
    })
    if (res.ok) return res.json()
  } catch {}
  return { items: [], total: 0, count: 0 }
}