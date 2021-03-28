/*
  Warnings:

  - The migration will remove the values [RETURNED] on the enum `OrderStatus`. If these variants are still used in the database, the migration will fail.
  - Changed the type of `stock` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('CANCELLED', 'PENDING', 'FUFILLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TABLE "Order" ALTER COLUMN "status" SET  DEFAULT E'PENDING';
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "stock",
ADD COLUMN     "stock" INTEGER NOT NULL;
