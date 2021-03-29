/*
  Warnings:

  - Added the required column `vendor_payment_status` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "vendor_payment_status" "PaymentStatus" NOT NULL;
