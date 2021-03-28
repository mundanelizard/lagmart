/*
  Warnings:

  - You are about to drop the column `quantity` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `order_group_id` on the `Invoice` table. All the data in the column will be lost.
  - The `category_id` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `user_id` to the `Cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_status` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'NOT_PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH');

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_order_group_id_fkey";

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Discount" ALTER COLUMN "percent" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "quantity",
DROP COLUMN "total",
DROP COLUMN "order_group_id",
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL,
ADD COLUMN     "orderGroupId" INTEGER;

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "category_id",
ADD COLUMN     "category_id" INTEGER[],
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- CreateTable
CREATE TABLE "Images" (
    "id" SERIAL NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagesGroup" (
    "id" SERIAL NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToProduct_AB_unique" ON "_CategoryToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToProduct_B_index" ON "_CategoryToProduct"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD FOREIGN KEY ("orderGroupId") REFERENCES "OrderGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
