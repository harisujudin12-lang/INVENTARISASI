import { prisma } from '@/lib/prisma'

// ==================== DEFAULT VALUES ====================
const DEFAULTS: Record<string, string> = {
  form_title: 'Request Barang',
  form_description: '',
}

// ==================== GET SETTING ====================
export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } })
  return setting?.value ?? DEFAULTS[key] ?? ''
}

// ==================== GET MULTIPLE SETTINGS ====================
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
  })

  const result: Record<string, string> = {}
  for (const key of keys) {
    const found = settings.find((s) => s.key === key)
    result[key] = found?.value ?? DEFAULTS[key] ?? ''
  }
  return result
}

// ==================== SET SETTING ====================
export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

// ==================== SET MULTIPLE SETTINGS ====================
export async function setSettings(data: Record<string, string>) {
  const operations = Object.entries(data).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  )
  return prisma.$transaction(operations)
}
