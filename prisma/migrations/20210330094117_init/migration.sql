/*
  Warnings:

  - Added the required column `type` to the `Cart` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CartItemType" AS ENUM ('PRODUCT', 'ITEM');

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "item_id" INTEGER,
ADD COLUMN     "type" "CartItemType" NOT NULL,
ALTER COLUMN "product_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Cart" ADD FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
