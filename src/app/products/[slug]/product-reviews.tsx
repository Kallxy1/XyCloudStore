'use client'

import { useState } from 'react'
import { Star, User, CheckCircle, Camera, Send, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface ProductReviewsProps {
  productId: string
  initialReviews: Array<{
    id: string
    rating: number
    title?: string | null
    content: string
    images: string[]
    isVerified: boolean
    helpful: number
    createdAt: Date | string
    user: { name: string | null; image: string | null }
  }>
}

export function ProductReviews({ productId, initialReviews }: ProductReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !content.trim()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('productId', productId)
      formData.append('rating', rating.toString())
      formData.append('title', title)
      formData.append('content', content)
      images.forEach(img => formData.append('images', img))

      const res = await fetch('/api/reviews', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Ulasan berhasil dikirim')
        setShowForm(false)
        setRating(0)
        setTitle('')
        setContent('')
        setImages([])
        // Refresh reviews
        const refreshed = await fetch(`/api/reviews?productId=${productId}`).then(r => r.json())
        setReviews(refreshed.reviews || [])
      } else {
        toast.error(data.error || 'Gagal mengirim ulasan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 text-center">
          <div className="text-6xl font-bold text-primary">{averageRating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-muted-foreground mt-2">{reviews.length} ulasan</p>
        </div>

        <div className="md:col-span-2 space-y-3">
          {distribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm w-8">{star} <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 inline" /></span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-16 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      <Button
        onClick={() => setShowForm(true)}
        className="w-full sm:w-auto"
        variant="outline"
      >
        <Send className="h-4 w-4 mr-2" />
        Tulis Ulasan
      </Button>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-muted/30 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tulis Ulasan</h3>
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                  aria-label={`${star} bintang`}
                  aria-checked={rating === star}
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Judul Ulasan (opsional)"
            placeholder="Contoh: Produk bagus, pengiriman cepat"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
          />

          <Textarea
            label="Ulasan Anda"
            placeholder="Ceritakan pengalaman Anda dengan produk ini..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2">Foto (opsional, max 3)</label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, index) => (
                <div key={index} className="relative h-20 w-20 rounded-lg overflow-hidden">
                  <img src={img} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tambah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => setImages([...images, reader.result as string])
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </Button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Belum ada ulasan</h3>
            <p className="text-muted-foreground mt-1">Jadilah orang pertama yang mengulas produk ini</p>
          </div>
        ) : (
          reviews.map(review => (
            <article key={review.id} className="p-6 border rounded-xl space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {review.user.image ? (
                    <img src={review.user.image} alt={review.user.name || 'User'} className="h-10 w-10 rounded-full" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{review.user.name || 'Anonymous'}</div>
                    {review.isVerified && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Pembeli Terverifikasi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={cn(
                            'h-4 w-4',
                            star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>

              {review.title && (
                <h4 className="font-medium">{review.title}</h4>
              )}

              <p className="text-muted-foreground whitespace-pre-wrap">{review.content}</p>

              {review.images.length > 0 && (
                <div className="flex gap-2">
                  {review.images.map((img, index) => (
                    <img key={index} src={img} alt={`Review image ${index + 1}`} className="h-24 w-24 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  Membantu ({review.helpful})
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  Kurang Membantu
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

// Missing imports
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'