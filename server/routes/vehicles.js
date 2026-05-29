const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { protect } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.post('/', protect, async (req, res) => {
  try {
    const { vehicleNumber, vehicleType } = req.body
    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({ message: 'Vehicle number and type are required' })
    }
    const normalized = vehicleNumber.trim().toUpperCase()
    let vehicle = await prisma.vehicle.findFirst({
      where: { userId: req.user.id, vehicleNumber: normalized }
    })
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { userId: req.user.id, vehicleNumber: normalized, vehicleType }
      })
    }
    res.status(201).json(vehicle)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.get('/', protect, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { userId: req.user.id } })
    res.json(vehicles)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router
