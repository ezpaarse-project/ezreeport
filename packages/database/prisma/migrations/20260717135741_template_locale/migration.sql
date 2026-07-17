/*
  Warnings:

  - Added the required column `locale` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- All templates were in french
-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'fr';
-- Remove default values
-- AlterTable
ALTER TABLE "Template" ALTER COLUMN   "locale" DROP DEFAULT;
