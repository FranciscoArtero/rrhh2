import { PrismaClient, TipoFichaje, MetodoVerificacion, Rol } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Create Admin
  const adminEmail = 'admin@lavene.com'
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.usuarioAdmin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      nombre: 'Administrador Principal',
      passwordHash,
      rol: Rol.SUPER_ADMIN,
    },
  })
  console.log(`Created admin: ${admin.email}`)

  // 2. Create Locales (Buenos Aires coordinates)
  const localesData = [
    {
      nombre: 'Local Centro',
      direccion: 'Av. Corrientes 1234, CABA',
      latitud: -34.6037,
      longitud: -58.3816,
      radioMetros: 100,
    },
    {
      nombre: 'Local Palermo',
      direccion: 'Av. Santa Fe 3200, CABA',
      latitud: -34.5885,
      longitud: -58.4106,
      radioMetros: 150,
    },
    {
      nombre: 'Local Belgrano',
      direccion: 'Av. Cabildo 2000, CABA',
      latitud: -34.5623,
      longitud: -58.4563,
      radioMetros: 100,
    },
  ]

  for (const l of localesData) {
    await prisma.local.create({ data: l })
  }
  console.log(`Created ${localesData.length} locales`)

  // 3. Create Employees
  const employeesData = [
    { nombre: 'Ana', apellido: 'García', dni: '11111111', email: 'ana@empresa.com' },
    { nombre: 'María', apellido: 'Lopez', dni: '22222222', email: 'maria@empresa.com' },
    { nombre: 'Lucía', apellido: 'Pérez', dni: '33333333', email: 'lucia@empresa.com' },
    { nombre: 'Sofía', apellido: 'Diaz', dni: '44444444', email: 'sofia@empresa.com' },
    { nombre: 'Valentina', apellido: 'Martinez', dni: '55555555', email: 'valentina@empresa.com' },
  ]

  for (const e of employeesData) {
    await prisma.empleada.create({
      data: {
        ...e,
        pin: '1234', // Default PIN for testing
        activa: true,
      }
    })
  }
  console.log(`Created ${employeesData.length} employees`)

  console.log('✅ Seed processing finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
