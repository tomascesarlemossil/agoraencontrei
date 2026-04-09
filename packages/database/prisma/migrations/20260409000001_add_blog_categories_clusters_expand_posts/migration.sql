-- CreateTable: blog_categories
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: blog_clusters
CREATE TABLE "blog_clusters" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "pillarPostId" TEXT,
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_clusters_pkey" PRIMARY KEY ("id")
);

-- AlterTable: blog_posts - Add new columns
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "bodyMarkdown" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "coverImageAlt" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "coverImageCaption" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "galleryImages" JSONB DEFAULT '[]';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "videoEmbed" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "clusterId" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "keywordPrincipal" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "keywordsSecundarias" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "noindex" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ogTitle" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ogDescription" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ogImage" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "twitterTitle" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "twitterDescription" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "twitterImage" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "schemaType" TEXT DEFAULT 'BlogPosting';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "breadcrumbLabel" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "intencaoBusca" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "estagioFunil" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ctaFinal" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "faq" JSONB DEFAULT '[]';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "linksInternos" JSONB DEFAULT '[]';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "postsRelacionados" JSONB DEFAULT '[]';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "cidade" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "bairro" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "tipoImovel" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "seoPriority" INTEGER DEFAULT 0;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "commercialPriority" INTEGER DEFAULT 0;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "editorialNotes" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "cannibalizationNotes" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

-- Update default authorName for new posts
ALTER TABLE "blog_posts" ALTER COLUMN "authorName" SET DEFAULT 'Equipe AgoraEncontrei';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "blog_categories_companyId_slug_key" ON "blog_categories"("companyId", "slug");
CREATE INDEX IF NOT EXISTS "blog_categories_companyId_status_idx" ON "blog_categories"("companyId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "blog_clusters_companyId_slug_key" ON "blog_clusters"("companyId", "slug");
CREATE INDEX IF NOT EXISTS "blog_clusters_companyId_status_idx" ON "blog_clusters"("companyId", "status");

CREATE INDEX IF NOT EXISTS "blog_posts_companyId_status_idx" ON "blog_posts"("companyId", "status");
CREATE INDEX IF NOT EXISTS "blog_posts_categoryId_idx" ON "blog_posts"("categoryId");
CREATE INDEX IF NOT EXISTS "blog_posts_clusterId_idx" ON "blog_posts"("clusterId");
CREATE INDEX IF NOT EXISTS "blog_posts_cidade_idx" ON "blog_posts"("cidade");

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blog_clusters" ADD CONSTRAINT "blog_clusters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blog_clusters" ADD CONSTRAINT "blog_clusters_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "blog_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
