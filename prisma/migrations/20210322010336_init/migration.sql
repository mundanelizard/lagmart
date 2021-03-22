/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `deleted` on the `User` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `Wishlist` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CANCELLED', 'PENDING', 'RETURNED', 'FUFILLED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'DELETED', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT E'PENDING';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stock" INTEGER[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deleted",
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT E'PENDING';

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemGroup" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemGroup" ADD FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemGroup" ADD FOREIGN KEY ("item_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
