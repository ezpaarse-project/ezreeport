-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIENNIAL', 'YEARLY');

-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userUsername" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "targets" TEXT[],
    "recurrence" "Recurrence" NOT NULL,
    "lastRun" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "history" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_organisation_idx" ON "User"("organisation");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userUsername_fkey" FOREIGN KEY ("userUsername") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
