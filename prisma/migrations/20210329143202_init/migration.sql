/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[discount_code]` on the table `Discount`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Discount.discount_code_unique" ON "Discount"("discount_code");
