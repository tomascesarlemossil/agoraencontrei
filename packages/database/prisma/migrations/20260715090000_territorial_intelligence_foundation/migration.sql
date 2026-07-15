CREATE TABLE "territorial_cities" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "stateCode" TEXT NOT NULL,
  "ibgeCode" TEXT, "slug" TEXT NOT NULL, "sourceId" TEXT,
  "confidence" INTEGER NOT NULL DEFAULT 50, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "territorial_cities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "territorial_neighborhoods" (
  "id" TEXT NOT NULL, "cityId" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'OFFICIAL', "sourceId" TEXT, "confidence" INTEGER NOT NULL DEFAULT 50,
  "boundary" JSONB, "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "territorial_neighborhoods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "territorial_neighborhood_aliases" (
  "id" TEXT NOT NULL, "neighborhoodId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL, "sourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "territorial_neighborhood_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "territorial_streets" (
  "id" TEXT NOT NULL, "cityId" TEXT NOT NULL, "neighborhoodId" TEXT,
  "name" TEXT NOT NULL, "normalizedName" TEXT NOT NULL, "streetType" TEXT,
  "postalCode" TEXT, "sourceId" TEXT, "confidence" INTEGER NOT NULL DEFAULT 50,
  "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "territorial_streets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "properties" ADD COLUMN "territorialCityId" TEXT;
ALTER TABLE "properties" ADD COLUMN "territorialNeighborhoodId" TEXT;
ALTER TABLE "properties" ADD COLUMN "territorialStreetId" TEXT;

CREATE UNIQUE INDEX "territorial_cities_ibgeCode_key" ON "territorial_cities"("ibgeCode");
CREATE UNIQUE INDEX "territorial_cities_stateCode_slug_key" ON "territorial_cities"("stateCode", "slug");
CREATE INDEX "territorial_cities_name_stateCode_idx" ON "territorial_cities"("name", "stateCode");
CREATE UNIQUE INDEX "territorial_neighborhoods_cityId_slug_key" ON "territorial_neighborhoods"("cityId", "slug");
CREATE INDEX "territorial_neighborhoods_cityId_name_idx" ON "territorial_neighborhoods"("cityId", "name");
CREATE UNIQUE INDEX "territorial_neighborhood_aliases_neighborhoodId_normalizedName_key" ON "territorial_neighborhood_aliases"("neighborhoodId", "normalizedName");
CREATE INDEX "territorial_neighborhood_aliases_normalizedName_idx" ON "territorial_neighborhood_aliases"("normalizedName");
CREATE UNIQUE INDEX "territorial_streets_cityId_normalizedName_neighborhoodId_key" ON "territorial_streets"("cityId", "normalizedName", "neighborhoodId");
CREATE INDEX "territorial_streets_cityId_normalizedName_idx" ON "territorial_streets"("cityId", "normalizedName");
CREATE INDEX "territorial_streets_postalCode_idx" ON "territorial_streets"("postalCode");
CREATE INDEX "properties_territorialCityId_idx" ON "properties"("territorialCityId");
CREATE INDEX "properties_territorialNeighborhoodId_idx" ON "properties"("territorialNeighborhoodId");
CREATE INDEX "properties_territorialStreetId_idx" ON "properties"("territorialStreetId");

ALTER TABLE "territorial_neighborhoods" ADD CONSTRAINT "territorial_neighborhoods_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "territorial_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "territorial_neighborhood_aliases" ADD CONSTRAINT "territorial_neighborhood_aliases_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "territorial_streets" ADD CONSTRAINT "territorial_streets_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "territorial_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "territorial_streets" ADD CONSTRAINT "territorial_streets_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_territorialCityId_fkey" FOREIGN KEY ("territorialCityId") REFERENCES "territorial_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_territorialNeighborhoodId_fkey" FOREIGN KEY ("territorialNeighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_territorialStreetId_fkey" FOREIGN KEY ("territorialStreetId") REFERENCES "territorial_streets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
