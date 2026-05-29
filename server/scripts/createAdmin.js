const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  try {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@parkease.com',
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
      },
    })
    console.log('Admin account created:', admin.email)
  } catch (err) {
    if (err.code === 'P2002') {
      console.log('Admin account already exists (admin@parkease.com).')
    } else {
      throw err
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
