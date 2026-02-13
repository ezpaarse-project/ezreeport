-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "recurrenceOffset" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "TaskPreset" ADD COLUMN     "recurrenceOffset" JSONB NOT NULL DEFAULT '{}';
