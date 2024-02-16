-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "tags" JSONB[] DEFAULT ARRAY[]::JSONB[];
