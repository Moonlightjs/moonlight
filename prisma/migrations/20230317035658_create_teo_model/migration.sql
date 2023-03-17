-- CreateEnum
CREATE TYPE "TeoEnum" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateTable
CREATE TABLE "Teo" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT E'1',
    "longText" TEXT NOT NULL,
    "richText" TEXT,
    "password" VARCHAR(255),
    "integer" INTEGER NOT NULL DEFAULT 232,
    "bigint" BIGINT,
    "decimal" DECIMAL(10,2),
    "float" DOUBLE PRECISION,
    "date" DATE,
    "datetime" TIMESTAMP,
    "time" TIME,
    "boolean" BOOLEAN,
    "json" JSONB,
    "enum" "TeoEnum",
    "publishedAt" TIMESTAMPTZ,
    "publishedById" UUID,
    "publishedBy" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,

    CONSTRAINT "Teo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teo_name_key" ON "Teo"("name");
