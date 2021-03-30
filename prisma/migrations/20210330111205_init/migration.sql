/*
  Warnings:

  - Added the required column `item_id` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "item_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
