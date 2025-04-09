/*
  Warnings:

  - The values [APK,LTW,SAW] on the enum `CompetencyCode` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Assessment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompetencyScore` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AssessmentSourceType" AS ENUM ('KP', 'PADP', 'EVAL', 'AS');

-- AlterEnum
BEGIN;
CREATE TYPE "CompetencyCode_new" AS ENUM ('KNO', 'PRO', 'FPA', 'FPM', 'COM', 'LDR', 'WSA', 'WLM', 'PSD');
ALTER TABLE "CompetencyWeight" ALTER COLUMN "competencyCode" TYPE "CompetencyCode_new" USING ("competencyCode"::text::"CompetencyCode_new");
ALTER TABLE "PilotCompetencyScore" ALTER COLUMN "competencyCode" TYPE "CompetencyCode_new" USING ("competencyCode"::text::"CompetencyCode_new");
ALTER TYPE "CompetencyCode" RENAME TO "CompetencyCode_old";
ALTER TYPE "CompetencyCode_new" RENAME TO "CompetencyCode";
DROP TYPE "CompetencyCode_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_pilotId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencyScore" DROP CONSTRAINT "CompetencyScore_assessmentId_fkey";

-- DropTable
DROP TABLE "Assessment";

-- DropTable
DROP TABLE "CompetencyScore";

-- DropEnum
DROP TYPE "AssessmentType";

-- CreateTable
CREATE TABLE "CompetencyWeight" (
    "id" SERIAL NOT NULL,
    "competencyCode" "CompetencyCode" NOT NULL,
    "sourceType" "AssessmentSourceType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotCompetencyScore" (
    "id" SERIAL NOT NULL,
    "pilotId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "competencyCode" "CompetencyCode" NOT NULL,
    "sourceType" "AssessmentSourceType" NOT NULL,
    "score" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotCompetencyScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyWeight_competencyCode_sourceType_key" ON "CompetencyWeight"("competencyCode", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "PilotCompetencyScore_pilotId_competencyCode_sourceType_key" ON "PilotCompetencyScore"("pilotId", "competencyCode", "sourceType");

-- AddForeignKey
ALTER TABLE "PilotCompetencyScore" ADD CONSTRAINT "PilotCompetencyScore_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotCompetencyScore" ADD CONSTRAINT "PilotCompetencyScore_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
