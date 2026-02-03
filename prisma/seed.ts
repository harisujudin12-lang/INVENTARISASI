import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding database...')

  // ==================== ADMIN ====================
  const adminPassword = await hash('admin123', 12)
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: 'Administrator',
    },
  })
  console.log('✅ Admin dibuat:', admin.username)

  // ==================== DIVISI ====================
  const divisions = [
    'IT',
    'HRD',
    'Finance',
    'Marketing',
    'Operations',
    'General Affairs',
  ]

  for (const name of divisions) {
    await prisma.division.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log('✅ Divisi dibuat:', divisions.length)

  // ==================== BARANG ====================
  const items = [
    { name: 'Pulpen Hitam', stock: 100, threshold: 20 },
    { name: 'Pulpen Biru', stock: 80, threshold: 20 },
    { name: 'Buku Tulis A5', stock: 50, threshold: 15 },
    { name: 'Kertas HVS A4 (rim)', stock: 30, threshold: 10 },
    { name: 'Stapler', stock: 15, threshold: 5 },
    { name: 'Isi Staples', stock: 40, threshold: 10 },
    { name: 'Amplop Putih', stock: 200, threshold: 50 },
    { name: 'Map Folder', stock: 60, threshold: 20 },
    { name: 'Penghapus', stock: 45, threshold: 15 },
    { name: 'Pensil 2B', stock: 70, threshold: 20 },
    { name: 'Spidol Whiteboard', stock: 25, threshold: 10 },
    { name: 'Penggaris 30cm', stock: 20, threshold: 5 },
    { name: 'Gunting', stock: 12, threshold: 5 },
    { name: 'Lakban Bening', stock: 18, threshold: 5 },
    { name: 'Kalkulator', stock: 8, threshold: 3 },
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: { stock: item.stock, threshold: item.threshold },
      create: item,
    })
  }
  console.log('✅ Barang dibuat:', items.length)

  // ==================== FORM FIELDS DEFAULT ====================
  const formFields = [
    {
      fieldName: 'requester_name',
      fieldType: 'text',
      fieldLabel: 'Nama Lengkap',
      isRequired: true,
      sortOrder: 1,
    },
    {
      fieldName: 'division_id',
      fieldType: 'dropdown',
      fieldLabel: 'Divisi',
      isRequired: true,
      sortOrder: 2,
    },
    {
      fieldName: 'phone',
      fieldType: 'text',
      fieldLabel: 'Nomor Telepon',
      isRequired: false,
      sortOrder: 3,
    },
    {
      fieldName: 'notes',
      fieldType: 'text',
      fieldLabel: 'Catatan Tambahan',
      isRequired: false,
      sortOrder: 4,
    },
  ]

  for (const field of formFields) {
    await prisma.formField.upsert({
      where: { fieldName: field.fieldName },
      update: {},
      create: field,
    })
  }
  console.log('✅ Form fields dibuat:', formFields.length)

  // ==================== REQUEST COUNTER ====================
  const currentYear = new Date().getFullYear()
  await prisma.requestCounter.upsert({
    where: { year: currentYear },
    update: {},
    create: { year: currentYear, lastNumber: 0 },
  })
  console.log('✅ Request counter dibuat untuk tahun:', currentYear)

  console.log('🎉 Seeding selesai!')
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
