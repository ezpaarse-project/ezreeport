-- CreateTable
CREATE TABLE "RateLimit" (
    "source" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "count" INTEGER,
    "ttl" TIMESTAMP(3),

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("source","route")
);
