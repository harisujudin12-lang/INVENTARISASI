import { prisma } from '@/lib/prisma'

// ==================== GET ADMIN NOTIFICATIONS ====================
export async function getAdminNotifications(adminId: string) {
  return prisma.notification.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

// ==================== GET UNREAD COUNT ====================
export async function getUnreadCount(adminId: string) {
  return prisma.notification.count({
    where: { adminId, isRead: false },
  })
}

// ==================== MARK AS READ ====================
export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })
}

// ==================== MARK ALL AS READ ====================
export async function markAllAsRead(adminId: string) {
  await prisma.notification.updateMany({
    where: { adminId, isRead: false },
    data: { isRead: true },
  })

  return { success: true }
}

// ==================== GET USER NOTIFICATIONS (BY TRACKING TOKEN) ====================
export async function getUserNotifications(trackingToken: string) {
  return prisma.notification.findMany({
    where: { trackingToken },
    orderBy: { createdAt: 'desc' },
  })
}
