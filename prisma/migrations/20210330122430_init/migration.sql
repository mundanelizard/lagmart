/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[category_name]` on the table `Category`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Category.category_name_unique" ON "Category"("category_name");
