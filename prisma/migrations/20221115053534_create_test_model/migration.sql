-- AlterTable
ALTER TABLE "AdminPermission" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AdminRole" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;
