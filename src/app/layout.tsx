import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'TokoKita - Belanja Online Terpercaya',
    template: '%s | TokoKita',
  },
  description: 'Belanja online aman dan nyaman di TokoKita. Produk berkualitas, harga terjangkau, pengiriman cepat ke seluruh Indonesia.',
  keywords: ['belanja online', 'toko online', 'e-commerce', 'indonesia', 'murah', 'terpercaya'],
  authors: [{ name: 'TokoKita' }],
  creator: 'TokoKita',
  publisher: 'TokoKita',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://tokokita.com',
    siteName: 'TokoKita',
    title: 'TokoKita - Belanja Online Terpercaya',
    description: 'Belanja online aman dan nyaman di TokoKita. Produk berkualitas, harga terjangkau, pengiriman cepat.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TokoKita',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokoKita - Belanja Online Terpercaya',
    description: 'Belanja online aman dan nyaman di TokoKita.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}