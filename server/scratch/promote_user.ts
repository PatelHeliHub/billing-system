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
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!adminRole) {
    console.error('Admin role not found');
    return;
  }

  const user = await prisma.user.update({
    where: { email: 'helipatel049@gmail.com' },
    data: { roleId: adminRole.id }
  });

  console.log(`Promoted ${user.email} to Admin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
