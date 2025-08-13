/*
  Warnings:

  - The values [KNO] on the enum `CompetencyCode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CompetencyCode_new" AS ENUM ('PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM');
ALTER TABLE "CompetencyWeight" ALTER COLUMN "competencyCode" TYPE "CompetencyCode_new" USING ("competencyCode"::text::"CompetencyCode_new");
ALTER TABLE "PilotCompetencyScore" ALTER COLUMN "competencyCode" TYPE "CompetencyCode_new" USING ("competencyCode"::text::"CompetencyCode_new");
ALTER TABLE "ExerciseCompetency" ALTER COLUMN "competencyCode" TYPE "CompetencyCode_new" USING ("competencyCode"::text::"CompetencyCode_new");
ALTER TYPE "CompetencyCode" RENAME TO "CompetencyCode_old";
ALTER TYPE "CompetencyCode_new" RENAME TO "CompetencyCode";
DROP TYPE "CompetencyCode_old";
COMMIT;
