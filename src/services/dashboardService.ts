import { prisma } from '@/lib/prisma'
import { DashboardData } from '@/types'
import { getTotalStock, getLowStockItems } from './inventoryService'
import { RequestStatus } from '@prisma/client'

export async function getDashboardData(adminId: string): Promise<DashboardData> {
  const [
    totalStock,
    lowStockItems,
    totalItems,
    pendingRequests,
    recentRequests,
    unreadNotifications,
  ] = await Promise.all([
    getTotalStock(),
    getLowStockItems(),
    prisma.item.count({ where: { isActive: true } }),
    prisma.request.count({ where: { status: RequestStatus.PENDING } }),
    prisma.request.findMany({
      where: {},
      include: {
        division: true,
        approvedBy: true,
        requestItems: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.count({
      where: { adminId, isRead: false },
    }),
  ])

  return {
    totalStock,
    totalItems,
    lowStockItems,
    pendingRequests,
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      trackingToken: r.trackingToken,
      requesterName: r.requesterName,
      divisionId: r.divisionId,
      divisionName: r.division.name,
      status: r.status,
      rejectionReason: r.rejectionReason,
      formData: r.formData as Record<string, unknown>,
      requestDate: r.requestDate,
      approvalDate: r.approvalDate,
      approvedByName: r.approvedBy?.name || null,
      items: r.requestItems.map((ri) => ({
        id: ri.id,
        itemId: ri.itemId,
        itemName: ri.item.name,
        qtyRequested: ri.qtyRequested,
        qtyApproved: ri.qtyApproved,
      })),
    })),
  }
}
