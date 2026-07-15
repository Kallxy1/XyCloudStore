import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ addresses: [] }, { status: 401 })
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ addresses })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const formData = await request.formData()
  const data = {
    label: formData.get('label') as string,
    recipientName: formData.get('recipientName') as string,
    phone: formData.get('phone') as string,
    province: formData.get('province') as string,
    city: formData.get('city') as string,
    district: formData.get('district') as string,
    village: formData.get('village') as string,
    postalCode: formData.get('postalCode') as string,
    detail: formData.get('detail') as string,
    isDefault: formData.get('isDefault') === 'true',
  }

  // Validation
  if (!data.label || !data.recipientName || !data.phone || !data.province || !data.city || !data.district || !data.village || !data.postalCode || !data.detail) {
    return NextResponse.json({ success: false, error: 'Semua field wajib diisi' }, { status: 400 })
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ success: true, address })
}