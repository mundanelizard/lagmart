-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
