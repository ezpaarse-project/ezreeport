/*
  Warnings:

  - You are about to drop the column `lastRun` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `userUsername` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `institution` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userUsername_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "lastRun",
DROP COLUMN "userUsername",
ADD COLUMN     "institution" TEXT NOT NULL,
ADD COLUMN     "nextRun" TIMESTAMP(3);

-- DropTable
DROP TABLE "User";

-- CreateIndex
CREATE INDEX "Task_institution_idx" ON "Task"("institution");
