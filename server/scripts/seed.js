const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const prisma = new PrismaClient()

const WEEKDAYS = Array.from({ length: 7 }, (_, i) => i)

const makeSchedule = (parkingListingId, open = '06:00', close = '22:00', closedDays = []) =>
  WEEKDAYS.map((day) => ({
    parkingListingId,
    dayOfWeek: day,
    openingTime: open,
    closingTime: close,
    isAvailable: !closedDays.includes(day),
  }))

async function main() {
  console.log('Seeding database...')

  const rounds = 12
  const adminHash = await bcrypt.hash('Admin@123456', rounds)
  const ownerHash = await bcrypt.hash('Owner@123456', rounds)
  const userHash  = await bcrypt.hash('User@123456',  rounds)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@parkease.com' },
    update: { password: adminHash, name: 'Admin', role: 'ADMIN', isVerified: true },
    create: { name: 'Admin', email: 'admin@parkease.com', password: adminHash, role: 'ADMIN', isVerified: true, phone: '+91 98000 00001' },
  })
  console.log('Admin:', admin.email)

  const owner = await prisma.user.upsert({
    where: { email: 'owner@parkease.com' },
    update: { password: ownerHash, name: 'Rajesh Kumar', role: 'OWNER', isVerified: true },
    create: { name: 'Rajesh Kumar', email: 'owner@parkease.com', password: ownerHash, role: 'OWNER', isVerified: true, phone: '+91 98000 00002' },
  })
  console.log('Owner:', owner.email)

  const testUser = await prisma.user.upsert({
    where: { email: 'user@parkease.com' },
    update: { password: userHash, name: 'Priya Singh', role: 'USER' },
    create: { name: 'Priya Singh', email: 'user@parkease.com', password: userHash, role: 'USER', phone: '+91 98000 00003' },
  })
  console.log('User:', testUser.email)

  const listings = [
    {
      title: 'Bandra West Secure Parking',
      description: 'Safe and well-lit covered parking in the heart of Bandra West, close to Linking Road shopping area. CCTV monitored 24/7.',
      address: '14th Road, Khar West, Bandra, Mumbai',
      city: 'Mumbai',
      latitude: 19.0607,
      longitude: 72.8362,
      totalSlots: 20,
      supportedVehicleTypes: ['FOUR_WHEELER', 'TWO_WHEELER'],
      hourlyPrice: 60,
      dailyPrice: 500,
      monthlyPrice: 8000,
      slotSize: 'MEDIUM',
      autoApproveBookings: true,
      approvalStatus: 'APPROVED',
      scheduleOpen: '06:00',
      scheduleClose: '23:00',
      closedDays: [],
    },
    {
      title: 'Connaught Place Metro Parking',
      description: 'Multi-level parking near Rajiv Chowk metro station, ideal for office goers and shoppers. CCTV, security guard on duty.',
      address: 'Block L, Connaught Place, New Delhi',
      city: 'Delhi',
      latitude: 28.6304,
      longitude: 77.2177,
      totalSlots: 40,
      supportedVehicleTypes: ['FOUR_WHEELER', 'TWO_WHEELER'],
      hourlyPrice: 50,
      dailyPrice: 400,
      monthlyPrice: 7000,
      slotSize: 'LARGE',
      autoApproveBookings: true,
      approvalStatus: 'APPROVED',
      scheduleOpen: '05:00',
      scheduleClose: '23:30',
      closedDays: [],
    },
    {
      title: 'Koramangala Premium Parking',
      description: 'Open and covered parking in Koramangala 5th Block, near food street and tech offices. Reserved slots available.',
      address: '5th Block, Koramangala, Bengaluru',
      city: 'Bangalore',
      latitude: 12.9352,
      longitude: 77.6245,
      totalSlots: 15,
      supportedVehicleTypes: ['FOUR_WHEELER', 'TWO_WHEELER'],
      hourlyPrice: 40,
      dailyPrice: 300,
      monthlyPrice: 5000,
      slotSize: 'MEDIUM',
      autoApproveBookings: true,
      approvalStatus: 'APPROVED',
      scheduleOpen: '07:00',
      scheduleClose: '22:00',
      closedDays: [0],
    },
    {
      title: 'HITEC City Tech Park Parking',
      description: 'Spacious parking for cars and bikes near Cyber Towers, HITEC City. Suitable for IT professionals and weekend visitors.',
      address: 'Cyber Towers Road, HITEC City, Hyderabad',
      city: 'Hyderabad',
      latitude: 17.4448,
      longitude: 78.3839,
      totalSlots: 50,
      supportedVehicleTypes: ['FOUR_WHEELER', 'TWO_WHEELER'],
      hourlyPrice: 45,
      dailyPrice: 350,
      monthlyPrice: 6000,
      slotSize: 'LARGE',
      autoApproveBookings: true,
      approvalStatus: 'APPROVED',
      scheduleOpen: '06:00',
      scheduleClose: '22:00',
      closedDays: [],
    },
    {
      title: 'T Nagar Shopping Parking',
      description: 'Convenient parking in the busiest shopping district in Chennai. Minutes from Pondy Bazaar and Ranganathan Street.',
      address: 'South Usman Road, T Nagar, Chennai',
      city: 'Chennai',
      latitude: 13.0418,
      longitude: 80.2341,
      totalSlots: 25,
      supportedVehicleTypes: ['FOUR_WHEELER', 'TWO_WHEELER'],
      hourlyPrice: 35,
      dailyPrice: 280,
      monthlyPrice: 4500,
      slotSize: 'MEDIUM',
      autoApproveBookings: true,
      approvalStatus: 'APPROVED',
      scheduleOpen: '08:00',
      scheduleClose: '21:00',
      closedDays: [],
    },
  ]

  for (const listing of listings) {
    const { scheduleOpen, scheduleClose, closedDays, ...data } = listing

    const existing = await prisma.parkingListing.findFirst({
      where: { title: listing.title, ownerId: owner.id },
    })

    let parking
    if (existing) {
      parking = await prisma.parkingListing.update({
        where: { id: existing.id },
        data: { ...data, ownerId: owner.id },
      })
      console.log('Updated listing:', parking.title)
    } else {
      parking = await prisma.parkingListing.create({
        data: { ...data, ownerId: owner.id },
      })
      console.log('Created listing:', parking.title)
    }

    await prisma.availabilitySchedule.deleteMany({ where: { parkingListingId: parking.id } })
    await prisma.availabilitySchedule.createMany({
      data: makeSchedule(parking.id, scheduleOpen, scheduleClose, closedDays),
    })
    console.log('  -> Schedule set for', parking.title)
  }

  console.log('\nSeed complete.')
  console.log('\nTest accounts:')
  console.log('  Admin:  admin@parkease.com  / Admin@123456')
  console.log('  Owner:  owner@parkease.com  / Owner@123456')
  console.log('  User:   user@parkease.com   / User@123456')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
