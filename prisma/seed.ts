import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

const seed = async () => {
  try {
    await addListAdminPermissions();
    await addListAdminRoles();
    await addUserSuperAdmin();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

const addListAdminPermissions = async () => {
  await prisma.$transaction([
    prisma.adminPermission.upsert({
      create: {
        action: 'manage',
      },
      where: {
        action: 'manage',
      },
      update: {},
    }),
    prisma.adminPermission.upsert({
      create: {
        action: 'edit',
      },
      where: {
        action: 'edit',
      },
      update: {},
    }),
    prisma.adminPermission.upsert({
      create: {
        action: 'read',
      },
      where: {
        action: 'read',
      },
      update: {},
    }),
  ]);
  console.log('add list default permissions success');
};

const addListAdminRoles = async () => {
  await prisma.$transaction([
    prisma.adminRole.upsert({
      create: {
        code: 'super_admin',
        name: 'Super Admin',
        permissions: {
          connect: [
            {
              action: 'manage',
            },
          ],
        },
      },
      where: {
        code: 'super_admin',
      },
      update: {},
    }),
  ]);
  console.log('add list default role success');
};

const addUserSuperAdmin = async () => {
  const password = '!moonlight@123';
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);
  await prisma.adminUser.upsert({
    create: {
      email: 'sa@moonlight.com',
      username: 'sa@moonlight.com',
      password: passwordHash,
      isActive: true,
      displayName: 'Super Admin',
      verifiedAt: new Date(),
      roles: {
        connect: [
          {
            code: 'super_admin',
          },
        ],
      },
    },
    where: {
      username: 'sa@moonlight.com',
    },
    update: {},
  });
  console.log('add user super admin');
};

seed().then();
