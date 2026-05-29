const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { protect, allowRoles } = require('../middleware/auth')
const adminLogger = require('../middleware/adminLogger')

const router = express.Router()
const prisma = new PrismaClient()

router.get('/dashboard', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } })
    const totalOwners = await prisma.user.count({ where: { role: 'OWNER' } })
    const totalListings = await prisma.parkingListing.count()
    const totalBookings = await prisma.booking.count()
    const pendingListings = await prisma.parkingListing.count({ where: { approvalStatus: 'PENDING' } })
    res.json({ totalUsers, totalOwners, totalListings, totalBookings, pendingListings })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/users', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/parkings/pending', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const parkings = await prisma.parkingListing.findMany({
      where: { approvalStatus: 'PENDING' },
      include: { owner: { select: { name: true, email: true } } },
    })
    res.json(parkings)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/parkings/:id/approve', protect, allowRoles('ADMIN'), adminLogger('APPROVE_LISTING'), async (req, res) => {
  try {
    const updated = await prisma.parkingListing.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'APPROVED' },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/parkings/:id/reject', protect, allowRoles('ADMIN'), adminLogger('REJECT_LISTING'), async (req, res) => {
  try {
    const updated = await prisma.parkingListing.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'REJECTED' },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/bookings', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        parking: { select: { title: true, city: true, hourlyPrice: true } },
        vehicle: true,
      },
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/reports', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const completedBookings = await prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      include: { parking: { select: { city: true, title: true, id: true } } },
    })

    const totalRevenue = completedBookings.reduce((acc, b) => acc + b.totalAmount, 0)
    const thisMonthRevenue = completedBookings
      .filter((b) => new Date(b.createdAt) >= startOfMonth)
      .reduce((acc, b) => acc + b.totalAmount, 0)

    const [pendingCount, confirmedCount, cancelledCount, completedCount] = await Promise.all([
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
    ])

    const allBookings = await prisma.booking.findMany({
      include: { parking: { select: { city: true, title: true, id: true } } },
    })

    const cityMap = {}
    allBookings.forEach((b) => {
      const city = b.parking?.city || 'Unknown'
      cityMap[city] = (cityMap[city] || 0) + 1
    })
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }))

    const listingMap = {}
    allBookings.forEach((b) => {
      const id = b.parkingListingId
      const title = b.parking?.title || id
      if (!listingMap[id]) listingMap[id] = { title, count: 0 }
      listingMap[id].count++
    })
    const topListings = Object.values(listingMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    res.json({
      totalRevenue,
      thisMonthRevenue,
      bookingsByStatus: { PENDING: pendingCount, CONFIRMED: confirmedCount, CANCELLED: cancelledCount, COMPLETED: completedCount },
      topCities,
      topListings,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
