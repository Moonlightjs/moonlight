/*
  Warnings:

  - You are about to drop the column `testId` on the `Demo` table. All the data in the column will be lost.
  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Demo" DROP CONSTRAINT "Demo_testId_fkey";

-- AlterTable
ALTER TABLE "Demo" DROP COLUMN "testId";

-- DropTable
DROP TABLE "Test";

-- DropEnum
DROP TYPE "TestEnum";
