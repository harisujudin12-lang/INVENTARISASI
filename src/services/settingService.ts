import { prisma } from '@/lib/prisma'

// ==================== DEFAULT VALUES ====================
const DEFAULTS: Record<string, string> = {
  form_title: 'Request Barang',
  form_description: '',
}

// ==================== GET SETTING ====================
export async function getSetting(key: string): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } })
    return setting?.value ?? DEFAULTS[key] ?? ''
  } catch (error) {
    console.warn(`[Setting] Failed to get '${key}', using default:`, error)
    return DEFAULTS[key] ?? ''
  }
}

// ==================== GET MULTIPLE SETTINGS ====================
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    })

    const result: Record<string, string> = {}
    for (const key of keys) {
      const found = settings.find((s) => s.key === key)
      result[key] = found?.value ?? DEFAULTS[key] ?? ''
    }
    return result
  } catch (error) {
    console.warn('[Setting] Failed to get settings, using defaults:', error)
    const result: Record<string, string> = {}
    for (const key of keys) {
      result[key] = DEFAULTS[key] ?? ''
    }
    return result
  }
}

// ==================== SET SETTING ====================
export async function setSetting(key: string, value: string) {
  try {
    return await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  } catch (error) {
    console.error(`[Setting] Failed to set '${key}':`, error)
    throw new Error('Tabel settings belum tersedia. Jalankan prisma db push terlebih dahulu.')
  }
}

// ==================== SET MULTIPLE SETTINGS ====================
export async function setSettings(data: Record<string, string>) {
  try {
    const operations = Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
    return await prisma.$transaction(operations)
  } catch (error) {
    console.error('[Setting] Failed to set settings:', error)
    throw new Error('Tabel settings belum tersedia. Jalankan prisma db push terlebih dahulu.')
  }
}
