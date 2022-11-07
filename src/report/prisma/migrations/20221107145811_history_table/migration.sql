/*
  Warnings:

  - You are about to drop the column `history` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "history",
ADD COLUMN     "lastRun" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
