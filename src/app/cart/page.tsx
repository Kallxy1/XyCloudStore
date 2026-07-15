import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCart } from '@/lib/actions/cart'
import { CartView } from './cart-view'

export const metadata: Metadata = {
  title: 'Keranjang Belanja',
  description: 'Kelola keranjang belanja Anda di TokoKita.',
}

export default async function CartPage() {
  const cart = await getCart()

  return <CartView initialCart={cart} />
}