-- CreateTable
CREATE TABLE "TaskPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fetchOptions" JSONB,
    "recurrence" "Recurrence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TaskPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskPreset_name_key" ON "TaskPreset"("name");

-- AddForeignKey
ALTER TABLE "TaskPreset" ADD CONSTRAINT "TaskPreset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
