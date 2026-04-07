-- AlterTable
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "contractHtml" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "guaranteeType" TEXT;
