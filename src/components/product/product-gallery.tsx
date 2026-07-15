'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: Array<{ url: string; alt?: string }>
  selectedVariantImage?: string
}

export function ProductGallery({ images, selectedVariantImage }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const allImages = images.length > 0 ? images : [{ url: '/placeholder-product.jpg', alt: 'Product' }]
  const currentImage = selectedVariantImage || allImages[selectedIndex]?.url

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') setIsFullscreen(false)
  }

  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Perbesar gambar produk"
      >
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Tutup"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        <button
          onClick={goToPrevious}
          className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>

        <div className="relative max-h-[90vh] max-w-[90vw]">
          <Image
            src={currentImage}
            alt={allImages[selectedIndex]?.alt || 'Produk'}
            width={1200}
            height={1200}
            className="object-contain"
            priority
          />
        </div>

        <button
          onClick={goToNext}
          className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Selanjutnya"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>

        {/* Thumbnails in fullscreen */}
        {allImages.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'h-16 w-16 rounded overflow-hidden border-2 transition-all',
                  index === selectedIndex ? 'border-primary' : 'border-transparent hover:border-white/50'
                )}
                aria-label={`Gambar ${index + 1}`}
                aria-current={index === selectedIndex ? 'true' : 'false'}
              >
                <Image
                  src={image.url}
                  alt={image.alt || `Gambar ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="aspect-square overflow-hidden rounded-xl bg-muted" onClick={() => setIsFullscreen(true)}>
        <Image
          src={currentImage}
          alt={allImages[selectedIndex]?.alt || 'Produk'}
          fill
          className="object-cover transition-transform duration-300 hover:scale-[1.02] cursor-zoom-in"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
        />
        <Expand className="absolute right-4 bottom-4 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors" />
      </div>

      {/* Navigation Arrows */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors hidden md:flex"
            aria-label="Gambar sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors hidden md:flex"
            aria-label="Gambar selanjutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                index === selectedIndex ? 'border-primary' : 'border-transparent hover:border-primary/50'
              )}
              aria-label={`Gambar ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : 'false'}
            >
              <Image
                src={image.url}
                alt={image.alt || `Gambar ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}