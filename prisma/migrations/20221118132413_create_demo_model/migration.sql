/*
  Warnings:

  - You are about to drop the column `demoId` on the `Test` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_demoId_fkey";

-- AlterTable
ALTER TABLE "Demo" ADD COLUMN     "testId" UUID;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "demoId";

-- AddForeignKey
ALTER TABLE "Demo" ADD CONSTRAINT "Demo_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;
