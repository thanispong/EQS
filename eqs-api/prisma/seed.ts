import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminRole = await prisma.role.upsert({
    where: {
      name: 'admin',
    },
    update: {
      description: 'System administrator',
      isActive: true,
    },
    create: {
      name: 'admin',
      description: 'System administrator',
      isActive: true,
    },
  });

  const studentRole = await prisma.role.upsert({
    where: {
      name: 'student',
    },
    update: {
      description: 'Student user',
      isActive: true,
    },
    create: {
      name: 'student',
      description: 'Student user',
      isActive: true,
    },
  });

  const passwordHash = await bcrypt.hash(
    '12345678',
    12,
  );

  await prisma.user.upsert({
    where: {
      email: 'admin1@example.com',
    },
    update: {
      roleId: adminRole.id,
      passwordHash,
      displayName: 'Admin1',
      isActive: true,
    },
    create: {
      roleId: adminRole.id,
      email: 'admin1@example.com',
      passwordHash,
      displayName: 'Admin1',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: {
      email: 'student1@example.com',
    },
    update: {
      roleId: studentRole.id,
      passwordHash,
      displayName: 'Student1',
      isActive: true,
    },
    create: {
      roleId: studentRole.id,
      email: 'student1@example.com',
      passwordHash,
      displayName: 'Student1',
      isActive: true,
    },
  });

  console.log('Seed roles and demo users completed');
  console.log('Admin: admin1@example.com / 12345678');
  console.log(
    'Student: student1@example.com / 12345678',
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });