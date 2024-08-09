-- DropForeignKey
ALTER TABLE "TaskPreset" DROP CONSTRAINT "TaskPreset_templateId_fkey";

-- AddForeignKey
ALTER TABLE "TaskPreset" ADD CONSTRAINT "TaskPreset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
