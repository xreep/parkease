const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { protect, allowRoles } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.post('/block-slot', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const { parkingListingId, blockedDate, startTime, endTime, reason } = req.body
    const parking = await prisma.parkingListing.findUnique({ where: { id: parkingListingId } })
    if (!parking) return res.status(404).json({ message: 'Parking not found' })
    if (parking.ownerId !== req.user.id) return res.status(403).json({ message: 'Not authorized' })

    const slot = await prisma.blockedSlot.create({
      data: {
        parkingListingId,
        blockedDate: new Date(blockedDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason: reason || null,
      },
    })
    res.status(201).json(slot)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.get('/blocked-slots', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const ownerParkings = await prisma.parkingListing.findMany({
      where: { ownerId: req.user.id },
      select: { id: true },
    })
    const parkingIds = ownerParkings.map((p) => p.id)
    const slots = await prisma.blockedSlot.findMany({
      where: { parkingListingId: { in: parkingIds } },
      include: { parking: { select: { title: true } } },
      orderBy: { blockedDate: 'asc' },
    })
    res.json(slots)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.get('/blocked-slots/:parkingId', async (req, res) => {
  try {
    const slots = await prisma.blockedSlot.findMany({
      where: { parkingListingId: req.params.parkingId },
      orderBy: { blockedDate: 'asc' },
    })
    res.json(slots)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.delete('/blocked-slots/:id', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const slot = await prisma.blockedSlot.findUnique({ where: { id: req.params.id } })
    if (!slot) return res.status(404).json({ message: 'Slot not found' })
    const parking = await prisma.parkingListing.findUnique({ where: { id: slot.parkingListingId } })
    if (!parking || parking.ownerId !== req.user.id) return res.status(403).json({ message: 'Not authorized' })
    await prisma.blockedSlot.delete({ where: { id: req.params.id } })
    res.json({ message: 'Blocked slot removed' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.get('/earnings', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const ownerParkings = await prisma.parkingListing.findMany({
      where: { ownerId: req.user.id },
      select: { id: true },
    })
    const parkingIds = ownerParkings.map((p) => p.id)

    const completedBookings = await prisma.booking.findMany({
      where: { parkingListingId: { in: parkingIds }, status: 'COMPLETED' },
    })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const totalEarnings = completedBookings.reduce((acc, b) => acc + b.totalAmount, 0)
    const thisMonthEarnings = completedBookings
      .filter((b) => new Date(b.createdAt) >= startOfMonth)
      .reduce((acc, b) => acc + b.totalAmount, 0)
    const todayEarnings = completedBookings
      .filter((b) => new Date(b.createdAt) >= startOfDay)
      .reduce((acc, b) => acc + b.totalAmount, 0)

    res.json({
      totalEarnings,
      thisMonthEarnings,
      todayEarnings,
      bookingCount: completedBookings.length,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router
