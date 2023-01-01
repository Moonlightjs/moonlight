-- CreateEnum
CREATE TYPE "UserAttributeType" AS ENUM ('INTEGER', 'DECIMAL', 'VARCHAR', 'TEXT', 'DATETIME', 'BOOLEAN');

-- CreateTable
CREATE TABLE "ContentType" (
    "id" UUID NOT NULL,
    "contentTypesSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "deletedById" UUID,
    "deletedBy" TEXT,

    CONSTRAINT "ContentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255),
    "firstName" VARCHAR(100),
    "middleName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "displayName" VARCHAR(100),
    "phoneNumber" VARCHAR(100),
    "email" VARCHAR(100),
    "resetPasswordToken" VARCHAR(255),
    "registrationToken" VARCHAR(255),
    "lastLogin" TIMESTAMPTZ,
    "verifiedAt" TIMESTAMPTZ,
    "isRequiredVerify" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "deletedById" UUID,
    "deletedBy" TEXT,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUserAttribute" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "code" VARCHAR(30) NOT NULL,
    "type" "UserAttributeType" NOT NULL,
    "default" TEXT,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "deletedById" UUID,
    "deletedBy" TEXT,

    CONSTRAINT "AdminUserAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUserAttributeValue" (
    "id" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "value" VARCHAR(255) NOT NULL,

    CONSTRAINT "AdminUserAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" VARCHAR(100),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "deletedById" UUID,
    "deletedBy" TEXT,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(100),
    "properties" JSONB,
    "conditions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "deletedById" UUID,
    "deletedBy" TEXT,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserRoleRelation" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionAdminRoleRelation" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUserAttribute_code_key" ON "AdminUserAttribute"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_code_key" ON "AdminRole"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_action_key" ON "AdminPermission"("action");

-- CreateIndex
CREATE UNIQUE INDEX "_UserRoleRelation_AB_unique" ON "_UserRoleRelation"("A", "B");

-- CreateIndex
CREATE INDEX "_UserRoleRelation_B_index" ON "_UserRoleRelation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionAdminRoleRelation_AB_unique" ON "_PermissionAdminRoleRelation"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionAdminRoleRelation_B_index" ON "_PermissionAdminRoleRelation"("B");

-- AddForeignKey
ALTER TABLE "AdminUserAttributeValue" ADD CONSTRAINT "AdminUserAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AdminUserAttribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserAttributeValue" ADD CONSTRAINT "AdminUserAttributeValue_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRoleRelation" ADD CONSTRAINT "_UserRoleRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRoleRelation" ADD CONSTRAINT "_UserRoleRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionAdminRoleRelation" ADD CONSTRAINT "_PermissionAdminRoleRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "AdminPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionAdminRoleRelation" ADD CONSTRAINT "_PermissionAdminRoleRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
