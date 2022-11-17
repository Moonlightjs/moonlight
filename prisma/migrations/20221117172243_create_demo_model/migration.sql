-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "demoId" UUID;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_demoId_fkey" FOREIGN KEY ("demoId") REFERENCES "Demo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
