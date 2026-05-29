const express = require('express')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const { protect } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
})

router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, bookingId } = req.body
    if (!amount || !bookingId) {
      return res.status(400).json({ message: 'amount and bookingId are required' })
    }
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: 'booking_' + bookingId,
      notes: { bookingId },
    })
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (error) {
    res.status(500).json({ message: 'Payment order creation failed', error: error.message })
  }
})

router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ message: 'All payment fields are required' })
    }
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (generated_signature === razorpay_signature) {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED', paymentId: razorpay_payment_id },
      })
      res.json({ success: true, message: 'Payment verified successfully', booking })
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed', error: error.message })
  }
})

module.exports = router
