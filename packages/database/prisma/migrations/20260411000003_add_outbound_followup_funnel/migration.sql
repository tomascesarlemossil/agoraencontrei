-- CreateTable: outbound_messages
CREATE TABLE "outbound_messages" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "phone" TEXT NOT NULL,
    "senderNumber" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL DEFAULT 'A',
    "campaignId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "message" TEXT NOT NULL,
    "previewLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: followup_schedules
CREATE TABLE "followup_schedules" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "outboundId" TEXT,
    "phone" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "templateVersion" TEXT NOT NULL DEFAULT 'A',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followup_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sales_funnels
CREATE TABLE "sales_funnels" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "name" TEXT,
    "source" TEXT NOT NULL,
    "campaign" TEXT,
    "affiliateCode" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'captured',
    "previewSiteName" TEXT,
    "checkoutUrl" TEXT,
    "convertedAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_funnels_pkey" PRIMARY KEY ("id")
);

-- Indexes: outbound_messages
CREATE INDEX "outbound_messages_leadId_idx" ON "outbound_messages"("leadId");
CREATE INDEX "outbound_messages_phone_idx" ON "outbound_messages"("phone");
CREATE INDEX "outbound_messages_senderNumber_idx" ON "outbound_messages"("senderNumber");
CREATE INDEX "outbound_messages_campaignId_idx" ON "outbound_messages"("campaignId");
CREATE INDEX "outbound_messages_status_idx" ON "outbound_messages"("status");
CREATE INDEX "outbound_messages_templateVersion_idx" ON "outbound_messages"("templateVersion");
CREATE INDEX "outbound_messages_createdAt_idx" ON "outbound_messages"("createdAt");

-- Indexes: followup_schedules
CREATE INDEX "followup_schedules_leadId_idx" ON "followup_schedules"("leadId");
CREATE INDEX "followup_schedules_status_idx" ON "followup_schedules"("status");
CREATE INDEX "followup_schedules_scheduledAt_idx" ON "followup_schedules"("scheduledAt");
CREATE INDEX "followup_schedules_step_idx" ON "followup_schedules"("step");

-- Indexes: sales_funnels
CREATE INDEX "sales_funnels_phone_idx" ON "sales_funnels"("phone");
CREATE INDEX "sales_funnels_email_idx" ON "sales_funnels"("email");
CREATE INDEX "sales_funnels_source_idx" ON "sales_funnels"("source");
CREATE INDEX "sales_funnels_stage_idx" ON "sales_funnels"("stage");
CREATE INDEX "sales_funnels_campaign_idx" ON "sales_funnels"("campaign");
CREATE INDEX "sales_funnels_affiliateCode_idx" ON "sales_funnels"("affiliateCode");
CREATE INDEX "sales_funnels_createdAt_idx" ON "sales_funnels"("createdAt");
