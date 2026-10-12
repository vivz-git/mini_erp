-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE INDEX "Category_code_idx" ON "Category"("code");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");
