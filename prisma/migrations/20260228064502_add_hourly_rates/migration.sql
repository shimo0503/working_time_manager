-- CreateTable
CREATE TABLE "hourly_rates" (
    "id" TEXT NOT NULL,
    "rate" INTEGER NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hourly_rates_pkey" PRIMARY KEY ("id")
);
