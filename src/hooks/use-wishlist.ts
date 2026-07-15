'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'react-hot-toast'

interface WishlistItem {
  id: string
  productId: string
  variantId?: string | null
  product: {
    id: string
    slug: string
    name: string
    basePrice: number
    compareAtPrice?: number | null
    images: Array<{ url: string }>
  }
  variant?: {
    id: string
    name: string
    value: string
    price: number
    image?: string | null
  } | null
}

interface WishlistState {
  items: WishlistItem[]
  isLoading: boolean
  fetchWishlist: () => Promise<void>
  addToWishlist: (productId: string, variantId?: string) => Promise<void>
  removeFromWishlist: (itemId: string) => Promise<void>
  clearWishlist: () => Promise<void>
  isInWishlist: (productId: string, variantId?: string) => boolean
  toggleWishlist: (productId: string, variantId?: string) => Promise<void>
  count: number
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchWishlist: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/wishlist')
          if (res.ok) {
            const data = await res.json()
            set({ items: data.items || [] })
          }
        } catch (error) {
          console.error('Failed to fetch wishlist:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      addToWishlist: async (productId, variantId) => {
        set({ isLoading: true })
        try {
          const formData = new FormData()
          formData.append('productId', productId)
          if (variantId) formData.append('variantId', variantId)

          const res = await fetch('/api/wishlist', {
            method: 'POST',
            body: formData,
          })

          const data = await res.json()
          if (data.success) {
            toast.success('Ditambahkan ke wishlist')
            get().fetchWishlist()
          } else {
            toast.error(data.error || 'Gagal menambahkan ke wishlist')
          }
        } catch (error) {
          toast.error('Terjadi kesalahan')
        } finally {
          set({ isLoading: false })
        }
      },

      removeFromWishlist: async (itemId) => {
        set({ isLoading: true })
        try {
          const res = await fetch(`/api/wishlist/${itemId}`, {
            method: 'DELETE',
          })

          const data = await res.json()
          if (data.success) {
            toast.success('Dihapus dari wishlist')
            get().fetchWishlist()
          } else {
            toast.error(data.error || 'Gagal menghapus item')
          }
        } catch (error) {
          toast.error('Terjadi kesalahan')
        } finally {
          set({ isLoading: false })
        }
      },

      clearWishlist: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/wishlist', {
            method: 'DELETE',
          })

          const data = await res.json()
          if (data.success) {
            set({ items: [] })
            toast.success('Wishlist dikosongkan')
          }
        } catch (error) {
          console.error('Failed to clear wishlist:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      isInWishlist: (productId, variantId) => {
        return get().items.some(
          (item) => item.productId === productId && item.variantId === (variantId || null)
        )
      },

      toggleWishlist: async (productId, variantId) => {
        const exists = get().isInWishlist(productId, variantId)
        if (exists) {
          const item = get().items.find(
            (i) => i.productId === productId && i.variantId === (variantId || null)
          )
          if (item) get().removeFromWishlist(item.id)
        } else {
          get().addToWishlist(productId, variantId)
        }
      },

      get count() {
        return get().items.length
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export function useWishlist() {
  const {
    items,
    isLoading,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    toggleWishlist,
    count,
  } = useWishlistStore()

  return {
    items,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    toggleWishlist,
    count,
    refreshWishlist: fetchWishlist,
  }
}