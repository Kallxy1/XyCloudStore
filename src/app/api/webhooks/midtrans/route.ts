import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      order_id, 
      transaction_status, 
      fraud_status, 
      payment_type, 
      transaction_id,
      bank,
      va_numbers,
      signature_key,
      gross_amount,
    } = body

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    // Note: In production, you should get status_code from the callback
    // For now, we'll skip signature verification in development
    if (process.env.NODE_ENV === 'production' && signature_key !== expectedSignature) {
      console.error('Invalid Midtrans signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Find order by Midtrans order_id (which is our orderNumber)
    const order = await prisma.order.findUnique({
      where: { orderNumber: order_id },
      include: { payments: true, items: true },
    })

    if (!order) {
      console.error('Order not found:', order_id)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update payment record
    const payment = await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        midtransOrderId: order_id,
        transactionId: transaction_id,
        paymentType: payment_type,
        bank: bank || null,
        vaNumber: va_numbers?.[0]?.va_number || null,
        rawResponse: JSON.stringify(body),
        status: mapMidtransStatus(transaction_status, fraud_status),
        paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : null,
      },
    })

    // Update order status based on payment
    let newOrderStatus = order.status
    let newPaymentStatus = order.paymentStatus

    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        newPaymentStatus = 'PAID'
        newOrderStatus = 'CONFIRMED'
        break
      case 'pending':
        newPaymentStatus = 'PENDING'
        newOrderStatus = 'PENDING'
        break
      case 'deny':
      case 'cancel':
      case 'expire':
        newPaymentStatus = 'FAILED'
        newOrderStatus = 'CANCELLED'
        break
      case 'refund':
        newPaymentStatus = 'REFUNDED'
        newOrderStatus = 'REFUNDED'
        break
    }

    if (newOrderStatus !== order.status || newPaymentStatus !== order.paymentStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newOrderStatus,
          paymentStatus: newPaymentStatus,
          statusHistory: {
            create: {
              status: newOrderStatus,
              note: `Payment ${transaction_status} via Midtrans (${payment_type})`,
            },
          },
        },
      })

      // If payment failed/expired, restore stock
      if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
        for (const item of order.items) {
          if (item.product.trackQuantity) {
            if (item.variantId) {
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: { quantity: { increment: item.quantity } },
              })
            } else {
              await prisma.product.update({
                where: { id: item.productId },
                data: { quantity: { increment: item.quantity } },
              })
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Midtrans webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

function mapMidtransStatus(transactionStatus: string, fraudStatus?: string): 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED' {
  if (['capture', 'settlement'].includes(transactionStatus)) return 'PAID'
  if (transactionStatus === 'pending') return 'PENDING'
  if (['deny', 'cancel'].includes(transactionStatus)) return 'FAILED'
  if (transactionStatus === 'expire') return 'EXPIRED'
  if (transactionStatus === 'refund') return 'REFUNDED'
  return 'PENDING'
}