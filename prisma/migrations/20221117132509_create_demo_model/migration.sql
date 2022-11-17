-- CreateEnum
CREATE TYPE "DemoEnum" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateTable
CREATE TABLE "Demo" (
    "id" UUID NOT NULL,
    "shortText" VARCHAR(255) NOT NULL DEFAULT '1',
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
    "enum" "DemoEnum",
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "deletedById" UUID,
    "deletedBy" TEXT,

    CONSTRAINT "Demo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Demo_shortText_key" ON "Demo"("shortText");