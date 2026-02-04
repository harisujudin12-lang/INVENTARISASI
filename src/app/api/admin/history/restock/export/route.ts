import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getCurrentAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const history = await prisma.stockHistory.findMany({
      where: {
        action: {
          in: ['restock', 'reduction'],
        },
      },
      include: {
        item: true,
        admin: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const rows = history.map((h) => ({
      'Nama Barang': h.item.name,
      'Tipe': h.action === 'restock' ? 'Restock' : 'Reduction',
      'Qty': h.qtyChange > 0 ? h.qtyChange : Math.abs(h.qtyChange),
      'Tanda': h.qtyChange > 0 ? '+' : '-',
      'Admin': h.admin.name,
      'Tanggal': new Date(h.createdAt).toLocaleDateString('id-ID'),
      'Jam': new Date(h.createdAt).toLocaleTimeString('id-ID'),
      'Catatan': h.notes || '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Restock & Reduction')

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 8 },
      { wch: 6 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
    ]

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="restock-reduction-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export restock/reduction history error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal export' },
      { status: 500 }
    )
  }
}

