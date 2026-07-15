'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const user = session?.user
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isAdmin = user?.role === 'ADMIN'

  const login = (callbackUrl?: string) => {
    router.push(`/auth/signin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`)
  }

  const logout = () => {
    router.push('/api/auth/signout')
  }

  const updateUser = async (data: { name?: string; image?: string }) => {
    await update(data)
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
  }
}

// Hook for protecting client-side routes
export function useRequireAuth(redirectTo = '/auth/signin') {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, isLoading, router, pathname, redirectTo])

  return { isAuthenticated, isLoading }
}

// Hook for admin-only routes
export function useRequireAdmin(redirectTo = '/') {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      } else if (!isAdmin) {
        router.push(redirectTo)
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, redirectTo])

  return { isAuthenticated, isAdmin, isLoading }
}