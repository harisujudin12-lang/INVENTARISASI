const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetData() {
  try {
    console.log('🗑️  Starting data reset...\n')

    // Delete in order of dependencies
    console.log('Deleting Notifications...')
    const notificationsDeleted = await prisma.notification.deleteMany({})
    console.log(`✓ Deleted ${notificationsDeleted.count} notifications\n`)

    console.log('Deleting StockHistory...')
    const stockHistoryDeleted = await prisma.stockHistory.deleteMany({})
    console.log(`✓ Deleted ${stockHistoryDeleted.count} stock history records\n`)

    console.log('Deleting RequestItems...')
    const requestItemsDeleted = await prisma.requestItem.deleteMany({})
    console.log(`✓ Deleted ${requestItemsDeleted.count} request items\n`)

    console.log('Deleting Requests...')
    const requestsDeleted = await prisma.request.deleteMany({})
    console.log(`✓ Deleted ${requestsDeleted.count} requests\n`)

    console.log('Deleting StockAdjustments...')
    const adjustmentsDeleted = await prisma.stockAdjustment.deleteMany({})
    console.log(`✓ Deleted ${adjustmentsDeleted.count} stock adjustments\n`)

    console.log('Deleting Items...')
    const itemsDeleted = await prisma.item.deleteMany({})
    console.log(`✓ Deleted ${itemsDeleted.count} items\n`)

    console.log('✅ Data reset completed successfully!\n')
    console.log('Remaining data:')
    
    const divisions = await prisma.division.findMany()
    console.log(`  - Divisions: ${divisions.length}`)
    
    const formFields = await prisma.formField.findMany()
    console.log(`  - Form Fields: ${formFields.length}\n`)

    console.log('System is ready for fresh usage! 🚀')
  } catch (error) {
    console.error('❌ Error during reset:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetData()
