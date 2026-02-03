import { NextResponse } from 'next/server'
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

    const adjustments = await prisma.stockAdjustment.findMany({
      include: {
        item: true,
        admin: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const rows = adjustments.map((a) => ({
      'Nama Barang': a.item.name,
      'Stok Sebelum': a.stockBefore,
      'Stok Sesudah': a.stockAfter,
      'Selisih': a.stockAfter - a.stockBefore,
      'Tanda': a.stockAfter - a.stockBefore > 0 ? '+' : '-',
      'Admin': a.admin.name,
      'Tanggal': new Date(a.createdAt).toLocaleDateString('id-ID'),
      'Jam': new Date(a.createdAt).toLocaleTimeString('id-ID'),
      'Alasan': a.reason || '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Adjustment')

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 6 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
    ]

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="adjustment-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export adjustment history error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal export' },
      { status: 500 }
    )
  }
}
