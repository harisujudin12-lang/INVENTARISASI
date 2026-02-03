import { prisma } from '@/lib/prisma'

// ==================== GET ALL DIVISIONS ====================
export async function getAllDivisions() {
  return prisma.division.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

// ==================== CREATE DIVISION ====================
export async function createDivision(name: string) {
  const existing = await prisma.division.findUnique({
    where: { name },
  })

  if (existing) {
    if (!existing.isActive) {
      // Reaktivasi
      return prisma.division.update({
        where: { id: existing.id },
        data: { isActive: true },
      })
    }
    throw new Error('Nama divisi sudah ada')
  }

  return prisma.division.create({
    data: { name },
  })
}

// ==================== UPDATE DIVISION ====================
export async function updateDivision(id: string, name: string) {
  const division = await prisma.division.findUnique({
    where: { id },
  })

  if (!division) {
    throw new Error('Divisi tidak ditemukan')
  }

  // Cek nama unik
  if (name !== division.name) {
    const existing = await prisma.division.findUnique({
      where: { name },
    })
    if (existing) {
      throw new Error('Nama divisi sudah ada')
    }
  }

  return prisma.division.update({
    where: { id },
    data: { name },
  })
}

// ==================== DELETE DIVISION (SOFT) ====================
export async function deleteDivision(id: string) {
  const division = await prisma.division.findUnique({
    where: { id },
    include: {
      requests: {
        where: { status: 'PENDING' },
      },
    },
  })

  if (!division) {
    throw new Error('Divisi tidak ditemukan')
  }

  if (division.requests.length > 0) {
    throw new Error('Tidak dapat menghapus divisi yang masih ada request pending')
  }

  // Soft delete
  await prisma.division.update({
    where: { id },
    data: { isActive: false },
  })

  return { success: true }
}
