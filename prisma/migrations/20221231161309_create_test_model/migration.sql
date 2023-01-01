-- CreateEnum
CREATE TYPE "DemoEnum" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateEnum
CREATE TYPE "TestEnum" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateTable
CREATE TABLE "Demo" (
    "id" UUID NOT NULL,
    "date" DATE,
    "enum" "DemoEnum",
    "json" JSONB,
    "time" TIME,
    "float" DOUBLE PRECISION,
    "testId" UUID,
    "bigint" BIGINT,
    "boolean" BOOLEAN,
    "decimal" DECIMAL(10,2),
    "integer" INTEGER NOT NULL DEFAULT 232,
    "datetime" TIMESTAMP,
    "longText" TEXT NOT NULL,
    "password" VARCHAR(255),
    "richText" TEXT,
    "shortText" VARCHAR(255) NOT NULL DEFAULT '1',
    "publishedAt" TIMESTAMPTZ,
    "publishedById" UUID,
    "publishedBy" TEXT,
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

-- CreateTable
CREATE TABLE "Test" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT '1',
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
    "enum" "TestEnum",
    "publishedAt" TIMESTAMPTZ,
    "publishedById" UUID,
    "publishedBy" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Demo_shortText_key" ON "Demo"("shortText");

-- CreateIndex
CREATE UNIQUE INDEX "Test_name_key" ON "Test"("name");

-- AddForeignKey
ALTER TABLE "Demo" ADD CONSTRAINT "Demo_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;
