-- Central de permutas
CREATE TABLE "exchange_offers" (
    "id"               TEXT NOT NULL,
    "companyId"        TEXT,
    "name"             TEXT NOT NULL,
    "email"            TEXT NOT NULL,
    "phone"            TEXT,
    "offerType"        TEXT NOT NULL,
    "offerDescription" TEXT NOT NULL,
    "offerValue"       DECIMAL(12,2),
    "wantedType"       TEXT,
    "wantedCity"       TEXT,
    "wantedMaxValue"   DECIMAL(12,2),
    "status"           TEXT NOT NULL DEFAULT 'active',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "exchange_offers_status_idx" ON "exchange_offers"("status");
CREATE INDEX "exchange_offers_companyId_idx" ON "exchange_offers"("companyId");
