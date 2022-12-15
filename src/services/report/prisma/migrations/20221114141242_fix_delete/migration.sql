-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_taskId_fkey";

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
