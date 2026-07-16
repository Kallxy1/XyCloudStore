import Link from 'next/link'
import { Facebook, Instagram, Twitter, Youtube, Music } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    bantuan: [
      { label: 'Cara Belanja', href: '/help/cara-belanja' },
      { label: 'Metode Pembayaran', href: '/help/metode-pembayaran' },
      { label: 'Pengiriman & Ongkir', href: '/help/pengiriman' },
      { label: 'Kebijakan Pengembalian', href: '/help/pengembalian' },
      { label: 'FAQ', href: '/faq' },
    ],
    tentang: [
      { label: 'Tentang Kami', href: '/about' },
      { label: 'Karir', href: '/karir' },
      { label: 'Mitra & Affiliate', href: '/mitra' },
      { label: 'Pers & Media', href: '/pers' },
      { label: 'Kontak Kami', href: '/contact' },
    ],
    hukum: [
      { label: 'Syarat & Ketentuan', href: '/terms' },
      { label: 'Kebijakan Privasi', href: '/privacy' },
      { label: 'Kebijakan Cookie', href: '/cookies' },
      { label: 'Laporkan Pelanggaran', href: '/report' },
    ],
    aplikasi: [
      { label: 'Unduh di App Store', href: '#' },
      { label: 'Unduh di Play Store', href: '#' },
      { label: 'Unduh di Huawei AppGallery', href: '#' },
    ],
  }

  const socialLinks = [
    { label: 'Facebook', href: '#', icon: Facebook },
    { label: 'Instagram', href: '#', icon: Instagram },
    { label: 'Twitter', href: '#', icon: Twitter },
    { label: 'YouTube', href: '#', icon: Youtube },
    { label: 'TikTok', href: '#', icon: Music },
  ]

  const paymentMethods = [
    { label: 'Virtual Account', icon: '🏦' },
    { label: 'E-Wallet', icon: '📱' },
    { label: 'Kartu Kredit', icon: '💳' },
    { label: 'COD', icon: '💵' },
    { label: 'QRIS', icon: '📷' },
  ]

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
              <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" className="fill-current" />
                <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>TokoKita</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Toko online terpercaya dengan produk berkualitas, harga terjangkau, dan pengiriman cepat ke seluruh Indonesia.
            </p>

            {/* Social Media */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border hover:bg-accent transition-colors"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* App Download */}
            <div className="flex gap-2">
              <a href="#" className="h-12" aria-label="Download on App Store">
                <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" />
              </a>
              <a href="#" className="h-12" aria-label="Get it on Google Play">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" />
              </a>
            </div>
          </div>

          {/* Bantuan */}
          <nav aria-label="Bantuan">
            <h3 className="font-semibold mb-4">Bantuan</h3>
            <ul className="space-y-2">
              {footerLinks.bantuan.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tentang */}
          <nav aria-label="Tentang Kami">
            <h3 className="font-semibold mb-4">Tentang Kami</h3>
            <ul className="space-y-2">
              {footerLinks.tentang.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hukum */}
          <nav aria-label="Legal">
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.hukum.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold mb-4">Metode Pembayaran</h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span key={method.label} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground">
                  {method.icon} {method.label}
                </span>
              ))}
            </div>

            <h3 className="font-semibold mt-6 mb-4">Kurir Pengiriman</h3>
            <div className="flex flex-wrap gap-2">
              {['JNE', 'J&T', 'Sicepat', 'AnterAja', 'Ninja Xpress', 'Lion Parcel'].map((courier) => (
                <span key={courier} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground">
                  {courier}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} TokoKita. Hak Cipta Dilindungi.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Indonesia</span>
            <span>•</span>
            <span>Bahasa Indonesia</span>
            <span>•</span>
            <span>IDR</span>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/security" className="hover:text-foreground transition-colors">Keamanan</Link>
            <Link href="/accessibility" className="hover:text-foreground transition-colors">Aksesibilitas</Link>
            <Link href="/sitemap" className="hover:text-foreground transition-colors">Peta Situs</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}