/*
  Warnings:

  - You are about to drop the column `tags` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "tags";

-- CreateTable
CREATE TABLE "TemplateTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "TemplateTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TemplateToTemplateTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TemplateToTemplateTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateTag_name_key" ON "TemplateTag"("name");

-- CreateIndex
CREATE INDEX "_TemplateToTemplateTag_B_index" ON "_TemplateToTemplateTag"("B");

-- AddForeignKey
ALTER TABLE "_TemplateToTemplateTag" ADD CONSTRAINT "_TemplateToTemplateTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateToTemplateTag" ADD CONSTRAINT "_TemplateToTemplateTag_B_fkey" FOREIGN KEY ("B") REFERENCES "TemplateTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
