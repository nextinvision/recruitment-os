import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default admin user
  const adminEmail = 'admin@recruitment.com'
  const adminPassword = 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      },
    })

    console.log('✅ Created admin user:', admin.email)
    console.log('   Password:', adminPassword)
  } else {
    console.log('ℹ️  Admin user already exists')
  }

  // Create sample manager
  const managerEmail = 'manager@recruitment.com'
  const managerPassword = 'manager123'

  const existingManager = await prisma.user.findUnique({
    where: { email: managerEmail },
  })

  if (!existingManager) {
    const hashedPassword = await bcrypt.hash(managerPassword, 10)

    const manager = await prisma.user.create({
      data: {
        email: managerEmail,
        password: hashedPassword,
        firstName: 'Manager',
        lastName: 'User',
        role: UserRole.MANAGER,
      },
    })

    console.log('✅ Created manager user:', manager.email)
    console.log('   Password:', managerPassword)
  } else {
    console.log('ℹ️  Manager user already exists')
  }

  // Create sample recruiter
  const recruiterEmail = 'recruiter@recruitment.com'
  const recruiterPassword = 'recruiter123'

  const existingRecruiter = await prisma.user.findUnique({
    where: { email: recruiterEmail },
  })

  if (!existingRecruiter) {
    const hashedPassword = await bcrypt.hash(recruiterPassword, 10)

    const recruiter = await prisma.user.create({
      data: {
        email: recruiterEmail,
        password: hashedPassword,
        firstName: 'Recruiter',
        lastName: 'User',
        role: UserRole.RECRUITER,
      },
    })

    console.log('✅ Created recruiter user:', recruiter.email)
    console.log('   Password:', recruiterPassword)
  } else {
    console.log('ℹ️  Recruiter user already exists')
  }

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

