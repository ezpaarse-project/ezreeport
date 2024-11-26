-- AlterTable
ALTER TABLE "TaskPreset" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;
