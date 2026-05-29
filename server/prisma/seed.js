const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const PARKINGS = [
  {
    title: 'Connaught Place Parking Zone A',
    description: 'Secure covered parking in the heart of New Delhi\'s commercial district. 24/7 security and CCTV surveillance.',
    address: 'Block A, Connaught Place, New Delhi',
    city: 'Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    totalSlots: 40,
    hourlyPrice: 60,
    dailyPrice: 400,
    monthlyPrice: 5500,
  },
  {
    title: 'Nehru Place Multi-Level Parking',
    description: 'Multi-storey parking facility near the tech market. Easy access from the metro station.',
    address: 'Nehru Place, South Delhi',
    city: 'Delhi',
    latitude: 28.5497,
    longitude: 77.2536,
    totalSlots: 80,
    hourlyPrice: 40,
    dailyPrice: 280,
    monthlyPrice: 3500,
  },
  {
    title: 'Saket District Centre Parking',
    description: 'Ample parking space near select citywalk mall. Well-lit and patrolled around the clock.',
    address: 'District Centre, Saket, New Delhi',
    city: 'Delhi',
    latitude: 28.5244,
    longitude: 77.2130,
    totalSlots: 120,
    hourlyPrice: 50,
    dailyPrice: 350,
    monthlyPrice: 4500,
  },
  {
    title: 'Bandra Kurla Complex Parking Hub',
    description: 'Premium parking in Mumbai\'s financial district. Reserved slots available for monthly subscribers.',
    address: 'G Block, Bandra Kurla Complex, Mumbai',
    city: 'Mumbai',
    latitude: 19.0692,
    longitude: 72.8650,
    totalSlots: 60,
    hourlyPrice: 80,
    dailyPrice: 500,
    monthlyPrice: 6000,
  },
  {
    title: 'Nariman Point Parking Zone B',
    description: 'Waterfront parking near the iconic Nariman Point commercial area. Ideal for office-goers.',
    address: 'Nariman Point, Marine Drive, Mumbai',
    city: 'Mumbai',
    latitude: 18.9272,
    longitude: 72.8239,
    totalSlots: 35,
    hourlyPrice: 70,
    dailyPrice: 450,
    monthlyPrice: 5800,
  },
  {
    title: 'Dadar Station East Parking',
    description: 'Convenient parking near Dadar railway station. Perfect for daily commuters.',
    address: 'Station Road, Dadar East, Mumbai',
    city: 'Mumbai',
    latitude: 19.0178,
    longitude: 72.8478,
    totalSlots: 50,
    hourlyPrice: 40,
    dailyPrice: 250,
    monthlyPrice: 3000,
  },
  {
    title: 'MG Road Parking Complex',
    description: 'Central parking facility on Bengaluru\'s busiest road. Close to metro and shopping areas.',
    address: '12, MG Road, Shivaji Nagar, Bengaluru',
    city: 'Bangalore',
    latitude: 12.9757,
    longitude: 77.6095,
    totalSlots: 45,
    hourlyPrice: 50,
    dailyPrice: 320,
    monthlyPrice: 4000,
  },
  {
    title: 'Indiranagar 100 Feet Road Parking',
    description: 'Popular parking spot on the 100 Feet Road. Walking distance from restaurants and shops.',
    address: '47, 100 Feet Road, Indiranagar, Bengaluru',
    city: 'Bangalore',
    latitude: 12.9784,
    longitude: 77.6408,
    totalSlots: 30,
    hourlyPrice: 45,
    dailyPrice: 290,
    monthlyPrice: 3800,
  },
  {
    title: 'Electronic City Tech Park Parking',
    description: 'Dedicated IT park parking for employees and visitors. Shuttle service available inside campus.',
    address: 'Phase 1, Electronic City, Bengaluru',
    city: 'Bangalore',
    latitude: 12.8399,
    longitude: 77.6770,
    totalSlots: 200,
    hourlyPrice: 30,
    dailyPrice: 180,
    monthlyPrice: 2200,
  },
  {
    title: 'T.Nagar Usman Road Parking',
    description: 'Parking in Chennai\'s busiest shopping destination. Ideal for quick visits and extended stays.',
    address: 'Usman Road, T.Nagar, Chennai',
    city: 'Chennai',
    latitude: 13.0418,
    longitude: 80.2341,
    totalSlots: 55,
    hourlyPrice: 35,
    dailyPrice: 200,
    monthlyPrice: 2800,
  },
  {
    title: 'Anna Nagar Tower Park Parking',
    description: 'Spacious outdoor and covered parking near Anna Nagar Tower Park. Family-friendly area.',
    address: 'Anna Nagar Tower Park Road, Chennai',
    city: 'Chennai',
    latitude: 13.0891,
    longitude: 80.2098,
    totalSlots: 40,
    hourlyPrice: 30,
    dailyPrice: 180,
    monthlyPrice: 2500,
  },
  {
    title: 'HITEC City Tech Park Parking',
    description: 'Modern parking facility in Hyderabad\'s IT hub. EV charging points available.',
    address: 'Madhapur Road, HITEC City, Hyderabad',
    city: 'Hyderabad',
    latitude: 17.4486,
    longitude: 78.3908,
    totalSlots: 150,
    hourlyPrice: 40,
    dailyPrice: 250,
    monthlyPrice: 3200,
  },
  {
    title: 'Banjara Hills Road No.12 Parking',
    description: 'Upmarket parking in Hyderabad\'s premium residential and commercial zone.',
    address: 'Road No.12, Banjara Hills, Hyderabad',
    city: 'Hyderabad',
    latitude: 17.4156,
    longitude: 78.4347,
    totalSlots: 25,
    hourlyPrice: 55,
    dailyPrice: 350,
    monthlyPrice: 4200,
  },
  {
    title: 'Koregaon Park Parking Zone',
    description: 'Shaded parking in Pune\'s upscale Koregaon Park area. Close to cafes, restaurants and Osho Ashram.',
    address: 'Lane 5, Koregaon Park, Pune',
    city: 'Pune',
    latitude: 18.5363,
    longitude: 73.8940,
    totalSlots: 20,
    hourlyPrice: 45,
    dailyPrice: 280,
    monthlyPrice: 3600,
  },
  {
    title: 'FC Road Deccan Parking',
    description: 'Student-friendly affordable parking near Fergusson College Road. Open 24 hours.',
    address: 'Fergusson College Road, Deccan Gymkhana, Pune',
    city: 'Pune',
    latitude: 18.5203,
    longitude: 73.8467,
    totalSlots: 35,
    hourlyPrice: 20,
    dailyPrice: 150,
    monthlyPrice: 2000,
  },
]

async function main() {
  console.log('Seeding database...')

  const adminHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@parkease.com' },
    update: {},
    create: {
      name: 'ParkEase Admin',
      email: 'admin@parkease.com',
      password: adminHash,
      role: 'ADMIN',
      phone: '+91 9999999999',
      isVerified: true,
    },
  })
  console.log('Admin account ready: admin@parkease.com')

  const ownerHash = await bcrypt.hash('owner123', 10)
  let owner
  try {
    owner = await prisma.user.create({
      data: {
        name: 'ParkEase Owner',
        email: 'owner@parkease.com',
        password: ownerHash,
        role: 'OWNER',
        phone: '+91 9876543210',
        isVerified: true,
      },
    })
    console.log('Created owner account:', owner.email)
  } catch {
    owner = await prisma.user.findUnique({ where: { email: 'owner@parkease.com' } })
    console.log('Owner account already exists:', owner.email)
  }

  let created = 0
  for (const p of PARKINGS) {
    try {
      const listing = await prisma.parkingListing.create({
        data: {
          ownerId: owner.id,
          title: p.title,
          description: p.description,
          address: p.address,
          city: p.city,
          latitude: p.latitude,
          longitude: p.longitude,
          totalSlots: p.totalSlots,
          supportedVehicleTypes: ['TWO_WHEELER', 'FOUR_WHEELER'],
          hourlyPrice: p.hourlyPrice,
          dailyPrice: p.dailyPrice,
          monthlyPrice: p.monthlyPrice,
          approvalStatus: 'APPROVED',
          autoApproveBookings: true,
          slotSize: 'MEDIUM',
          photos: [],
        },
      })
      await prisma.availabilitySchedule.createMany({
        data: Array.from({ length: 7 }, (_, i) => ({
          parkingListingId: listing.id,
          dayOfWeek: i,
          openingTime: '06:00',
          closingTime: '22:00',
          isAvailable: true,
        })),
      })
      created++
    } catch (err) {
      console.log(`Skipped "${p.title}":`, err.message)
    }
  }

  console.log(`Seeding complete. Created ${created} parking listings.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
