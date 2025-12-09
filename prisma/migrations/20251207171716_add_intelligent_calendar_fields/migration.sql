-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'TASK', 'HABIT', 'FOCUS', 'BREAK', 'PERSONAL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "causedById" TEXT,
ADD COLUMN     "energyCost" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "flexibility" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "importance" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recurrenceParentId" TEXT,
ADD COLUMN     "recurrenceRule" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "type" "EventType" NOT NULL DEFAULT 'TASK';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "energyProfile" JSONB;

-- CreateIndex
CREATE INDEX "Event_userId_start_idx" ON "Event"("userId", "start");

-- CreateIndex
CREATE INDEX "Event_causedById_idx" ON "Event"("causedById");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_recurrenceParentId_fkey" FOREIGN KEY ("recurrenceParentId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_causedById_fkey" FOREIGN KEY ("causedById") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
