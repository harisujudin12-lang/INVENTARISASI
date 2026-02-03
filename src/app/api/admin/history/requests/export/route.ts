import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getRequestHistory } from '@/services/historyService'
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

    const result = await getRequestHistory({ limit: 10000 })

    // Format data untuk Excel
    const rows = result.data.flatMap((r) =>
      r.items.map((item) => ({
        'No Request': r.requestNumber,
        'Nama Requester': r.requesterName,
        'Divisi': r.divisionName,
        'Nama Barang': item.itemName,
        'Qty Diminta': item.qtyRequested,
        'Qty Disetujui': item.qtyApproved || '-',
        'Status': r.status,
        'Alasan Penolakan': r.rejectionReason || '-',
        'Tanggal Request': new Date(r.requestDate).toLocaleDateString('id-ID'),
        'Tanggal Approval': r.approvalDate ? new Date(r.approvalDate).toLocaleDateString('id-ID') : '-',
        'Diproses Oleh': r.approvedByName || '-',
      }))
    )

    // Buat workbook
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Request & Approval')

    // Set column width
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ]

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="request-approval-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export request history error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal export' },
      { status: 500 }
    )
  }
}
