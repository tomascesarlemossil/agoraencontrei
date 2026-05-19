-- Persistent in-app notifications (notification center)
CREATE TABLE "notifications" (
    "id"        TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId"    TEXT,
    "type"      TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "payload"   JSONB NOT NULL DEFAULT '{}',
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "readAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_companyId_read_createdAt_idx" ON "notifications"("companyId", "read", "createdAt");
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");
