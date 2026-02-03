import { prisma } from '@/lib/prisma'
import { CreateFormFieldRequest } from '@/types'

// ==================== GET ALL FORM FIELDS ====================
export async function getAllFormFields() {
  return prisma.formField.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

// ==================== CREATE FORM FIELD ====================
export async function createFormField(input: CreateFormFieldRequest) {
  // Generate unique fieldName dari label
  const fieldName = input.fieldName.toLowerCase().replace(/\s+/g, '_')

  const existing = await prisma.formField.findUnique({
    where: { fieldName },
  })

  if (existing) {
    if (!existing.isActive) {
      return prisma.formField.update({
        where: { id: existing.id },
        data: { ...input, fieldName, isActive: true },
      })
    }
    throw new Error('Nama field sudah ada')
  }

  // Get max sortOrder
  const maxOrder = await prisma.formField.aggregate({
    _max: { sortOrder: true },
  })

  return prisma.formField.create({
    data: {
      ...input,
      fieldName,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
    },
  })
}

// ==================== UPDATE FORM FIELD ====================
export async function updateFormField(
  id: string,
  input: Partial<CreateFormFieldRequest>
) {
  const field = await prisma.formField.findUnique({
    where: { id },
  })

  if (!field) {
    throw new Error('Field tidak ditemukan')
  }

  // Reserved fields tidak boleh diubah fieldName-nya
  const reservedFields = ['requester_name', 'division_id']
  if (reservedFields.includes(field.fieldName)) {
    const { fieldName, ...rest } = input
    return prisma.formField.update({
      where: { id },
      data: rest,
    })
  }

  return prisma.formField.update({
    where: { id },
    data: input,
  })
}

// ==================== DELETE FORM FIELD (SOFT) ====================
export async function deleteFormField(id: string) {
  const field = await prisma.formField.findUnique({
    where: { id },
  })

  if (!field) {
    throw new Error('Field tidak ditemukan')
  }

  // Reserved fields tidak boleh dihapus
  const reservedFields = ['requester_name', 'division_id']
  if (reservedFields.includes(field.fieldName)) {
    throw new Error('Field bawaan sistem tidak dapat dihapus')
  }

  await prisma.formField.update({
    where: { id },
    data: { isActive: false },
  })

  return { success: true }
}

// ==================== REORDER FIELDS ====================
export async function reorderFields(fieldIds: string[]) {
  const updates = fieldIds.map((id, index) =>
    prisma.formField.update({
      where: { id },
      data: { sortOrder: index + 1 },
    })
  )

  await prisma.$transaction(updates)

  return getAllFormFields()
}
