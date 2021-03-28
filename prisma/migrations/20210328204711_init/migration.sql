/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[order_id]` on the table `Invoice`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invoice_order_id_unique" ON "Invoice"("order_id");
