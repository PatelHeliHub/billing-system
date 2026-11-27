import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testStats() {
  try {
    const lowStockResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Product" WHERE "stockQuantity" <= "minStockLevel"`;
    console.log('Low stock success:', lowStockResult);

    const globalAgg = await prisma.invoice.aggregate({
      _sum: { totalAmount: true, amountPaid: true, dueAmount: true },
      _count: { _all: true }
    });
    console.log('Global agg success:', globalAgg);

    const statusCounts = await prisma.invoice.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { dueAmount: true }
    });
    console.log('Status counts success:', statusCounts);

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testStats();
