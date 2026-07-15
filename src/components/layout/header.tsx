'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, ShoppingCart, User, Heart, MapPin, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { itemCount } = useCart()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="hidden md:flex h-10 items-center justify-between border-b px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Gratis Ongkir Min. Belanja Rp 500.000</span>
          <span>•</span>
          <span>Hubungi Kami: 021-12345678</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-foreground transition-colors">
            Tentang Kami
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Kontak
          </Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" className="fill-current" />
            <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:block">TokoKita</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4 md:mx-8">
          <form action="/products" className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Cari produk, kategori, merek..."
              className="pl-10 h-10 md:h-11 text-sm"
              aria-label="Cari produk"
            />
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Wishlist */}
          <Link href="/wishlist" className="relative p-2 rounded-full hover:bg-accent transition-colors">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative p-2 rounded-full hover:bg-accent transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
            <span className="sr-only">Keranjang</span>
          </Link>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                    <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Akun Saya
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Pesanan Saya
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/addresses" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2 text-primary">
                      <Settings className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <form action="/api/auth/signout" method="POST">
                    <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  Masuk
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Daftar</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-4">
          <form action="/products" className="flex gap-2">
            <Input type="search" name="q" placeholder="Cari produk..." className="flex-1" />
            <Button type="submit">Cari</Button>
          </form>
          <nav className="flex flex-col space-y-2">
            <Link href="/products" className="px-2 py-2 hover:bg-accent rounded">
              Semua Produk
            </Link>
            <Link href="/categories" className="px-2 py-2 hover:bg-accent rounded">
              Kategori
            </Link>
            <Link href="/promo" className="px-2 py-2 hover:bg-accent rounded">
              Promo
            </Link>
            <Link href="/wishlist" className="px-2 py-2 hover:bg-accent rounded">
              Wishlist
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}