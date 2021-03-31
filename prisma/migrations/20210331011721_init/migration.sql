/*
  Warnings:

  - You are about to drop the column `type` on the `Cart` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "type";

-- DropEnum
DROP TYPE "CartItemType";
