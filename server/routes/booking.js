const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { protect, allowRoles } = require('../middleware/auth')
const { validate, bookingSchema } = require('../utils/validate')
const { sendBookingConfirmation } = require('../utils/mailer')

const router = express.Router()
const prisma = new PrismaClient()

router.post('/', protect, allowRoles('USER'), validate(bookingSchema), async (req, res) => {
  try {
    const { parkingListingId, vehicleId, startTime, endTime, vehicleType } = req.body

    if (!parkingListingId || !vehicleId || !startTime || !endTime || !vehicleType) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start <= new Date()) {
      return res.status(400).json({ message: 'Start time must be in the future' })
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' })
    }
    const hours = (end - start) / (1000 * 60 * 60)
    if (hours < 1) {
      return res.status(400).json({ message: 'Minimum booking duration is 1 hour' })
    }

    const parking = await prisma.parkingListing.findUnique({ where: { id: parkingListingId } })
    if (!parking) return res.status(404).json({ message: 'Parking not found' })
    if (parking.approvalStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'This parking is not available for booking' })
    }

    const activeBookings = await prisma.booking.count({
      where: {
        parkingListingId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    })
    if (activeBookings >= parking.totalSlots) {
      return res.status(400).json({ message: 'No slots available for selected time' })
    }

    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        parkingListingId,
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    })
    if (blockedSlots.length > 0) {
      return res.status(400).json({ message: 'This time slot is blocked by the owner' })
    }

    const totalAmount = hours * parking.hourlyPrice
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        parkingListingId,
        vehicleId,
        startTime: start,
        endTime: end,
        vehicleType,
        totalAmount,
        status: parking.autoApproveBookings ? 'CONFIRMED' : 'PENDING',
      },
      include: {
        user: { select: { name: true, email: true } },
        parking: true,
        vehicle: true,
      },
    })

    sendBookingConfirmation({
      to: booking.user.email,
      userName: booking.user.name,
      parkingTitle: parking.title,
      parkingAddress: parking.address + ', ' + parking.city,
      startTime,
      endTime,
      totalAmount,
      bookingId: booking.id,
    }).catch(() => {})

    res.status(201).json(booking)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { parking: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/owner-bookings', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { parking: { ownerId: req.user.id } },
      include: { user: { select: { name: true, email: true } }, parking: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } })
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.userId !== req.user.id && req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id/approve', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { parking: true }
    })
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.parking.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id/complete', protect, async (req, res) => {
  try {
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
