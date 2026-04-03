-- AlterTable: add repassePaidAt to rentals
ALTER TABLE "rentals" ADD COLUMN "repassePaidAt" TIMESTAMP(3);
