const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { protect, allowRoles } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.post('/', protect, allowRoles('USER'), async (req, res) => {
  try {
    const { bookingId, message } = req.body
    if (!bookingId || !message) return res.status(400).json({ message: 'bookingId and message are required' })

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' })

    const existing = await prisma.dispute.findUnique({ where: { bookingId } })
    if (existing) return res.status(400).json({ message: 'A dispute already exists for this booking' })

    const dispute = await prisma.dispute.create({
      data: { bookingId, userId: req.user.id, message },
    })
    res.status(201).json(dispute)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.get('/', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        user: { select: { name: true, email: true } },
        booking: { include: { parking: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(disputes)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.get('/my', protect, allowRoles('USER'), async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      where: { userId: req.user.id },
      select: { bookingId: true, status: true },
    })
    res.json(disputes)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.put('/:id/resolve', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const dispute = await prisma.dispute.findUnique({ where: { id: req.params.id } })
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' })
    const updated = await prisma.dispute.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED' },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router
