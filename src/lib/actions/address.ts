'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const addressSchema = z.object({
  label: z.string().min(1).max(50),
  recipientName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  province: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  village: z.string().min(1),
  postalCode: z.string().min(5).max(5),
  detail: z.string().min(10).max(500),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().default(false),
})

export async function getAddresses() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function getAddress(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.address.findFirst({
    where: { id, userId: session.user.id },
  })
}

export async function createAddress(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const rawData = {
    label: formData.get('label'),
    recipientName: formData.get('recipientName'),
    phone: formData.get('phone'),
    province: formData.get('province'),
    city: formData.get('city'),
    district: formData.get('district'),
    village: formData.get('village'),
    postalCode: formData.get('postalCode'),
    detail: formData.get('detail'),
    latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined,
    longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined,
    isDefault: formData.get('isDefault') === 'true',
  }

  const parsed = addressSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid', issues: parsed.error.flatten() }
  }

  // If setting as default, unset other defaults
  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  })

  revalidatePath('/account/addresses')
  revalidatePath('/checkout')

  return { success: true, address }
}

export async function updateAddress(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const address = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!address) {
    return { success: false, error: 'Alamat tidak ditemukan' }
  }

  const rawData = {
    label: formData.get('label'),
    recipientName: formData.get('recipientName'),
    phone: formData.get('phone'),
    province: formData.get('province'),
    city: formData.get('city'),
    district: formData.get('district'),
    village: formData.get('village'),
    postalCode: formData.get('postalCode'),
    detail: formData.get('detail'),
    latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined,
    longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined,
    isDefault: formData.get('isDefault') === 'true',
  }

  const parsed = addressSchema.partial().safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid', issues: parsed.error.flatten() }
  }

  // If setting as default, unset other defaults
  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    })
  }

  const updated = await prisma.address.update({
    where: { id },
    data: parsed.data,
  })

  revalidatePath('/account/addresses')
  revalidatePath('/checkout')

  return { success: true, address: updated }
}

export async function deleteAddress(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  const address = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!address) {
    return { success: false, error: 'Alamat tidak ditemukan' }
  }

  await prisma.address.delete({ where: { id } })

  revalidatePath('/account/addresses')
  revalidatePath('/checkout')

  return { success: true }
}

export async function setDefaultAddress(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Silakan login terlebih dahulu' }
  }

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id, userId: session.user.id },
      data: { isDefault: true },
    }),
  ])

  revalidatePath('/account/addresses')
  revalidatePath('/checkout')

  return { success: true }
}

// Indonesia provinces/cities data (simplified)
export async function getProvinces() {
  // In production, fetch from API like RajaOngkir or wilayah.id
  return [
    { id: '11', name: 'Aceh' },
    { id: '12', name: 'Sumatera Utara' },
    { id: '13', name: 'Sumatera Barat' },
    { id: '14', name: 'Riau' },
    { id: '15', name: 'Jambi' },
    { id: '16', name: 'Sumatera Selatan' },
    { id: '17', name: 'Bengkulu' },
    { id: '18', name: 'Lampung' },
    { id: '19', name: 'Kepulauan Bangka Belitung' },
    { id: '21', name: 'Kepulauan Riau' },
    { id: '31', name: 'DKI Jakarta' },
    { id: '32', name: 'Jawa Barat' },
    { id: '33', name: 'Jawa Tengah' },
    { id: '34', name: 'DI Yogyakarta' },
    { id: '35', name: 'Jawa Timur' },
    { id: '36', name: 'Banten' },
    { id: '51', name: 'Bali' },
    { id: '52', name: 'Nusa Tenggara Barat' },
    { id: '53', name: 'Nusa Tenggara Timur' },
    { id: '61', name: 'Kalimantan Barat' },
    { id: '62', name: 'Kalimantan Tengah' },
    { id: '63', name: 'Kalimantan Selatan' },
    { id: '64', name: 'Kalimantan Timur' },
    { id: '65', name: 'Kalimantan Utara' },
    { id: '71', name: 'Sulawesi Utara' },
    { id: '72', name: 'Sulawesi Tengah' },
    { id: '73', name: 'Sulawesi Selatan' },
    { id: '74', name: 'Sulawesi Tenggara' },
    { id: '75', name: 'Gorontalo' },
    { id: '76', name: 'Sulawesi Barat' },
    { id: '81', name: 'Maluku' },
    { id: '82', name: 'Maluku Utara' },
    { id: '91', name: 'Papua Barat' },
    { id: '94', name: 'Papua' },
  ]
}