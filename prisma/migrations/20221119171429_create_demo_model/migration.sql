/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Demo` table. All the data in the column will be lost.
  - You are about to drop the column `deletedBy` on the `Demo` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Demo` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `deletedBy` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Test` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Demo" DROP COLUMN "deletedAt",
DROP COLUMN "deletedBy",
DROP COLUMN "deletedById",
ADD COLUMN     "publishedAt" TIMESTAMPTZ,
ADD COLUMN     "publishedBy" TEXT,
ADD COLUMN     "publishedById" UUID;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "deletedAt",
DROP COLUMN "deletedBy",
DROP COLUMN "deletedById",
ADD COLUMN     "publishedAt" TIMESTAMPTZ,
ADD COLUMN     "publishedBy" TEXT,
ADD COLUMN     "publishedById" UUID;
