import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCart } from '@/lib/actions/cart'
import { getAddresses } from '@/lib/actions/address'
import { CheckoutForm } from './checkout-form'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Lengkapi pembayaran pesanan Anda di TokoKita.',
}

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/checkout')
  }

  const [cart, addresses] = await Promise.all([
    getCart(),
    getAddresses(),
  ])

  if (cart.items.length === 0) {
    redirect('/cart')
  }

  return <CheckoutForm initialCart={cart} initialAddresses={addresses} />
}