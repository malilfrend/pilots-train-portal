-- Шаг 1: Дедупликация PilotCompetencyScore — оставляем только самую свежую запись
-- для каждой пары (pilotId, competencyCode)
DELETE FROM "PilotCompetencyScore"
WHERE id NOT IN (
  SELECT DISTINCT ON ("pilotId", "competencyCode") id
  FROM "PilotCompetencyScore"
  ORDER BY "pilotId", "competencyCode", "date" DESC
);

-- Шаг 2: Удаляем unique constraint на (pilotId, competencyCode, sourceType)
ALTER TABLE "PilotCompetencyScore" DROP CONSTRAINT IF EXISTS "PilotCompetencyScore_pilotId_competencyCode_sourceType_key";

-- Шаг 3: Удаляем столбец sourceType из PilotCompetencyScore
ALTER TABLE "PilotCompetencyScore" DROP COLUMN "sourceType";

-- Шаг 4: Добавляем новый unique constraint на (pilotId, competencyCode)
ALTER TABLE "PilotCompetencyScore" ADD CONSTRAINT "PilotCompetencyScore_pilotId_competencyCode_key" UNIQUE ("pilotId", "competencyCode");

-- Шаг 5: Удаляем таблицу CompetencyWeight
DROP TABLE IF EXISTS "CompetencyWeight";

-- Шаг 6: Удаляем enum AssessmentSourceType
DROP TYPE IF EXISTS "AssessmentSourceType";
