import prisma from '../src/utils/prisma.js';

async function testProducts() {
  try {
    console.log('Testing Product fetch...');
    const products = await prisma.product.findMany({
      take: 1
    });
    console.log('Success! Count:', products.length);
    console.log('Sample Product:', JSON.stringify(products[0], null, 2));
  } catch (err: any) {
    console.error('CRITICAL FAILURE:');
    console.error(err);
    if (err.code) console.error('Error Code:', err.code);
    if (err.meta) console.error('Meta Data:', err.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testProducts();
