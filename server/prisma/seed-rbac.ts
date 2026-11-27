import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding roles and permissions...');

  const modules = [
    'dashboard', 'products', 'customers', 'billing', 
    'pos', 'inventory', 'suppliers', 'purchases', 'reports', 'users'
  ];

  // 1. Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      permissions: {
        create: modules.map(m => ({
          moduleName: m,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true
        }))
      }
    }
  });
  console.log('Admin role created');

  // 2. Create Manager Role
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      permissions: {
        create: modules.map(m => ({
          moduleName: m,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: m !== 'users' // Managers can't delete users
        }))
      }
    }
  });
  console.log('Manager role created');

  // 3. Create Cashier Role
  const cashierRole = await prisma.role.upsert({
    where: { name: 'Cashier' },
    update: {},
    create: {
      name: 'Cashier',
      permissions: {
        create: modules.map(m => ({
          moduleName: m,
          canView: ['pos', 'billing', 'customers', 'dashboard'].includes(m),
          canCreate: ['pos', 'billing', 'customers'].includes(m),
          canEdit: ['customers'].includes(m),
          canDelete: false
        }))
      }
    }
  });
  console.log('Cashier role created');

  // 4. Assign very first user to Admin if they exist
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (firstUser) {
    await prisma.user.update({
      where: { id: firstUser.id },
      data: { roleId: adminRole.id }
    });
    console.log(`Assigned first user ${firstUser.email} to Admin role`);
  }

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
