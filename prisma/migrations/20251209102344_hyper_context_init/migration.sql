-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('MANUAL', 'GOOGLE', 'NOTION', 'TODOIST', 'SLACK');

-- CreateEnum
CREATE TYPE "PredictionType" AS ENUM ('BURNOUT', 'CONFLICT', 'OVERLOAD');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "cognitiveLoad" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "contextTag" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "source" "EventSource" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "preferences" JSONB;

-- CreateTable
CREATE TABLE "Cause" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCause" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "relationType" TEXT NOT NULL DEFAULT 'GENERATED_BY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRelation" (
    "id" TEXT NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "toEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "PredictionType" NOT NULL,
    "predictedDate" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCause_causeId_eventId_key" ON "EventCause"("causeId", "eventId");

-- CreateIndex
CREATE INDEX "EventRelation_fromEventId_idx" ON "EventRelation"("fromEventId");

-- CreateIndex
CREATE INDEX "EventRelation_toEventId_idx" ON "EventRelation"("toEventId");

-- AddForeignKey
ALTER TABLE "Cause" ADD CONSTRAINT "Cause_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCause" ADD CONSTRAINT "EventCause_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCause" ADD CONSTRAINT "EventCause_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRelation" ADD CONSTRAINT "EventRelation_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRelation" ADD CONSTRAINT "EventRelation_toEventId_fkey" FOREIGN KEY ("toEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
