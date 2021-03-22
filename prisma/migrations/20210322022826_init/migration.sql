-- CreateTable
CREATE TABLE "UserValidation" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserValidation.email_unique" ON "UserValidation"("email");
