/*
  Warnings:

  - You are about to drop the `Demo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Demo" DROP CONSTRAINT "Demo_testId_fkey";

-- DropTable
DROP TABLE "Demo";

-- DropEnum
DROP TYPE "DemoEnum";
