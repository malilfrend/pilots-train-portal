/*
  Warnings:

  - The values [KP,PADP,AS] on the enum `AssessmentSourceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssessmentSourceType_new" AS ENUM ('PC', 'FDM', 'EVAL', 'ASR');
ALTER TABLE "CompetencyWeight" ALTER COLUMN "sourceType" TYPE "AssessmentSourceType_new" USING ("sourceType"::text::"AssessmentSourceType_new");
ALTER TABLE "PilotCompetencyScore" ALTER COLUMN "sourceType" TYPE "AssessmentSourceType_new" USING ("sourceType"::text::"AssessmentSourceType_new");
ALTER TYPE "AssessmentSourceType" RENAME TO "AssessmentSourceType_old";
ALTER TYPE "AssessmentSourceType_new" RENAME TO "AssessmentSourceType";
DROP TYPE "AssessmentSourceType_old";
COMMIT;
