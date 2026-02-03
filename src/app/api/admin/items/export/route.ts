import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'csv';

    // Get all items
    const items = await prisma.item.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    if (format === 'excel') {
      // Use dynamic import untuk xlsx
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventory');

      // Headers
      worksheet.columns = [
        { header: 'Nama Barang', key: 'name', width: 30 },
        { header: 'Stok Saat Ini', key: 'stock', width: 15 },
        { header: 'Threshold', key: 'threshold', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Tanggal Update', key: 'updatedAt', width: 20 },
      ];

      // Add rows
      items.forEach(item => {
        worksheet.addRow({
          name: item.name,
          stock: item.stock,
          threshold: item.threshold,
          status: item.stock <= item.threshold ? 'Stok Menipis' : 'Normal',
          updatedAt: new Date(item.updatedAt).toLocaleString('id-ID'),
        });
      });

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC7CEEA' },
      };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="inventory-${Date.now()}.xlsx"`,
        },
      });
    } else {
      // CSV format
      const headers = ['Nama Barang', 'Stok Saat Ini', 'Threshold', 'Status', 'Tanggal Update'];
      const rows = items.map(item => [
        `"${item.name.replace(/"/g, '""')}"`,
        item.stock,
        item.threshold,
        item.stock <= item.threshold ? 'Stok Menipis' : 'Normal',
        new Date(item.updatedAt).toLocaleString('id-ID'),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="inventory-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export gagal' },
      { status: 500 }
    );
  }
}
