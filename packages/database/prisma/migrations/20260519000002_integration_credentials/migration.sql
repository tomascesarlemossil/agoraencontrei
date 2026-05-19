-- Per-tenant integration credentials hub
CREATE TABLE "integration_credentials" (
    "id"           TEXT NOT NULL,
    "companyId"    TEXT NOT NULL,
    "provider"     TEXT NOT NULL,
    "credentials"  JSONB NOT NULL DEFAULT '{}',
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "testStatus"   TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_credentials_companyId_provider_key"
    ON "integration_credentials"("companyId", "provider");
CREATE INDEX "integration_credentials_companyId_idx"
    ON "integration_credentials"("companyId");
