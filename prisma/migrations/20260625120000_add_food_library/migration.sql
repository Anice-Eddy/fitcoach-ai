-- CreateTable
CREATE TABLE "food_library_items" (
    "id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "source" TEXT NOT NULL DEFAULT 'USER',
    "calories_per_100g" DOUBLE PRECISION NOT NULL,
    "protein_per_100g" DOUBLE PRECISION NOT NULL,
    "carbs_per_100g" DOUBLE PRECISION NOT NULL,
    "fat_per_100g" DOUBLE PRECISION NOT NULL,
    "fiber_per_100g" DOUBLE PRECISION,
    "sugar_per_100g" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "food_library_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "food_library_items_visibility_deleted_at_idx" ON "food_library_items"("visibility", "deleted_at");

-- CreateIndex
CREATE INDEX "food_library_items_created_by_user_id_deleted_at_idx" ON "food_library_items"("created_by_user_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "food_library_items"
ADD CONSTRAINT "food_library_items_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
