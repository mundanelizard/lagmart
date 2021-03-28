/*
  Warnings:

  - You are about to drop the column `orderGroupId` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_orderGroupId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "orderGroupId",
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;
