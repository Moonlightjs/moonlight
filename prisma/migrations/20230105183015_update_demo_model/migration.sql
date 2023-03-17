/*
  Warnings:

  - The values [evening,noon] on the enum `DemoEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DemoEnum_new" AS ENUM ('morning', 'afternoon');
ALTER TABLE "Demo" ALTER COLUMN "enum" TYPE "DemoEnum_new" USING ("enum"::text::"DemoEnum_new");
ALTER TYPE "DemoEnum" RENAME TO "DemoEnum_old";
ALTER TYPE "DemoEnum_new" RENAME TO "DemoEnum";
DROP TYPE "DemoEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "Demo" ALTER COLUMN "shortText" SET DEFAULT '1sfdsfad sdfsfs';
