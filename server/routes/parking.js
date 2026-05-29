const express = require('express')
const { PrismaClient } = require('@prisma/client')
const multer = require('multer')
const { protect, allowRoles } = require('../middleware/auth')
const { validate, parkingSchema } = require('../utils/validate')

const router = express.Router()
const prisma = new PrismaClient()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Only jpg, png, webp images are allowed'))
  },
})

const SCHEDULE_INCLUDE = { availabilitySchedule: { orderBy: { dayOfWeek: 'asc' } } }

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const DEFAULT_SCHEDULE = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openingTime: '06:00',
  closingTime: '22:00',
  isAvailable: true,
}))

const upsertSchedule = async (prismaClient, parkingListingId, schedule) => {
  await prismaClient.availabilitySchedule.deleteMany({ where: { parkingListingId } })
  if (schedule && schedule.length > 0) {
    await prismaClient.availabilitySchedule.createMany({
      data: schedule.map((s) => ({
        parkingListingId,
        dayOfWeek: Number(s.dayOfWeek),
        openingTime: s.openingTime || '06:00',
        closingTime: s.closingTime || '22:00',
        isAvailable: s.isAvailable !== false,
      })),
    })
  }
}

router.post('/upload-photos', protect, allowRoles('OWNER'), upload.array('photos', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ urls: [], message: 'No files provided' })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return res.json({ urls: [], message: 'Cloudinary not configured — upload skipped' })
    }

    const cloudinary = require('cloudinary').v2
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })

    const uploadPromises = req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'parkease', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
            (error, result) => {
              if (error) reject(error)
              else resolve(result.secure_url)
            }
          )
          stream.end(file.buffer)
        })
    )

    const urls = await Promise.all(uploadPromises)
    res.json({ urls })
  } catch (err) {
    console.error('Photo upload error:', err.message)
    res.status(500).json({ message: 'Upload failed', urls: [] })
  }
})

router.post('/', protect, allowRoles('OWNER'), validate(parkingSchema), async (req, res) => {
  try {
    const {
      title, description, address, city, latitude, longitude,
      totalSlots, hourlyPrice, dailyPrice, monthlyPrice, autoApproveBookings,
      slotSize, availabilitySchedule, photos,
    } = req.body
    const supportedVehicleTypes = req.body.supportedVehicleTypes || req.body.vehicleTypes || []

    const parking = await prisma.parkingListing.create({
      data: {
        ownerId: req.user.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        address: address.trim(),
        city: city.trim(),
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        totalSlots: parseInt(totalSlots) || 1,
        supportedVehicleTypes,
        hourlyPrice: parseFloat(hourlyPrice),
        dailyPrice: dailyPrice != null ? parseFloat(dailyPrice) : null,
        monthlyPrice: monthlyPrice != null ? parseFloat(monthlyPrice) : null,
        autoApproveBookings: autoApproveBookings ?? true,
        slotSize: slotSize || 'MEDIUM',
        photos: Array.isArray(photos) ? photos : [],
      },
      include: SCHEDULE_INCLUDE,
    })

    const schedule = Array.isArray(availabilitySchedule) && availabilitySchedule.length > 0
      ? availabilitySchedule
      : DEFAULT_SCHEDULE

    await upsertSchedule(prisma, parking.id, schedule)

    const full = await prisma.parkingListing.findUnique({
      where: { id: parking.id },
      include: { ...SCHEDULE_INCLUDE, owner: { select: { name: true, email: true } } },
    })
    res.status(201).json(full)
  } catch (error) {
    console.error('POST /parkings error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/owner/listings', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const parkings = await prisma.parkingListing.findMany({
      where: { ownerId: req.user.id },
      include: { owner: { select: { name: true, email: true } }, ...SCHEDULE_INCLUDE },
      orderBy: { createdAt: 'desc' },
    })
    res.json(parkings)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/search', async (req, res) => {
  try {
    const { city, vehicleType, date, startTime, endTime } = req.query

    const filters = { approvalStatus: 'APPROVED' }
    if (city) filters.city = { contains: city.trim(), mode: 'insensitive' }
    if (vehicleType) filters.supportedVehicleTypes = { has: vehicleType }

    let parkings = await prisma.parkingListing.findMany({
      where: filters,
      include: { owner: { select: { name: true, email: true } }, ...SCHEDULE_INCLUDE },
    })

    if (date && startTime && endTime) {
      const dateObj = new Date(date)
      const dayOfWeek = dateObj.getDay()
      const startMins = timeToMinutes(startTime)
      const endMins = timeToMinutes(endTime)

      parkings = parkings.filter((p) => {
        if (!p.availabilitySchedule || p.availabilitySchedule.length === 0) return true
        const daySchedule = p.availabilitySchedule.find((s) => s.dayOfWeek === dayOfWeek)
        if (!daySchedule) return true
        if (!daySchedule.isAvailable) return false
        const openMins = timeToMinutes(daySchedule.openingTime)
        const closeMins = timeToMinutes(daySchedule.closingTime)
        return startMins >= openMins && endMins <= closeMins
      })

      if (parkings.length > 0) {
        const searchStart = new Date(`${date}T${startTime}:00`)
        const searchEnd = new Date(`${date}T${endTime}:00`)
        const parkingIds = parkings.map((p) => p.id)

        const bookingCounts = await prisma.booking.groupBy({
          by: ['parkingListingId'],
          where: {
            parkingListingId: { in: parkingIds },
            status: { in: ['PENDING', 'CONFIRMED'] },
            AND: [
              { startTime: { lt: searchEnd } },
              { endTime: { gt: searchStart } },
            ],
          },
          _count: { id: true },
        })

        const countMap = {}
        for (const b of bookingCounts) {
          countMap[b.parkingListingId] = b._count.id
        }

        parkings = parkings.filter((p) => {
          const booked = countMap[p.id] || 0
          return booked < p.totalSlots
        })
      }
    }

    res.json(parkings)
  } catch (error) {
    console.error('GET /parkings/search error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const parkings = await prisma.parkingListing.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: { owner: { select: { name: true, email: true } }, ...SCHEDULE_INCLUDE },
    })
    res.json(parkings)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const parking = await prisma.parkingListing.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { name: true, email: true } }, ...SCHEDULE_INCLUDE },
    })
    if (!parking) return res.status(404).json({ message: 'Parking not found' })
    res.json(parking)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const parking = await prisma.parkingListing.findUnique({ where: { id: req.params.id } })
    if (!parking) return res.status(404).json({ message: 'Parking not found' })
    if (parking.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this resource' })
    }

    const {
      title, description, address, city, latitude, longitude,
      totalSlots, hourlyPrice, dailyPrice, monthlyPrice,
      autoApproveBookings, slotSize, photos, availabilitySchedule,
    } = req.body

    const updateData = {}
    if (title != null) updateData.title = title.trim()
    if (description != null) updateData.description = description.trim()
    if (address != null) updateData.address = address.trim()
    if (city != null) updateData.city = city.trim()
    if (latitude != null) updateData.latitude = parseFloat(latitude)
    if (longitude != null) updateData.longitude = parseFloat(longitude)
    if (totalSlots != null) updateData.totalSlots = parseInt(totalSlots)
    if (hourlyPrice != null) updateData.hourlyPrice = parseFloat(hourlyPrice)
    if (dailyPrice != null) updateData.dailyPrice = parseFloat(dailyPrice)
    if (monthlyPrice != null) updateData.monthlyPrice = parseFloat(monthlyPrice)
    if (autoApproveBookings != null) updateData.autoApproveBookings = autoApproveBookings
    if (slotSize != null) updateData.slotSize = slotSize
    if (Array.isArray(photos)) updateData.photos = photos

    const updated = await prisma.parkingListing.update({
      where: { id: req.params.id },
      data: updateData,
      include: { owner: { select: { name: true, email: true } }, ...SCHEDULE_INCLUDE },
    })

    if (Array.isArray(availabilitySchedule)) {
      await upsertSchedule(prisma, parking.id, availabilitySchedule)
    }

    const full = await prisma.parkingListing.findUnique({
      where: { id: parking.id },
      include: { owner: { select: { name: true, email: true } }, ...SCHEDULE_INCLUDE },
    })
    res.json(full)
  } catch (error) {
    console.error('PUT /parkings/:id error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', protect, allowRoles('OWNER'), async (req, res) => {
  try {
    const parking = await prisma.parkingListing.findUnique({ where: { id: req.params.id } })
    if (!parking) return res.status(404).json({ message: 'Parking not found' })
    if (parking.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this resource' })
    }
    await prisma.parkingListing.delete({ where: { id: req.params.id } })
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
