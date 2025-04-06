-- CreateEnum
CREATE TYPE "AssessmentSourceType" AS ENUM ('KP', 'PADP', 'EVAL', 'AS');

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

-- Заполняем веса компетенций по умолчанию
INSERT INTO "CompetencyWeight" ("competencyCode", "sourceType", "weight", "createdAt", "updatedAt") VALUES
('KNO', 'KP', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('KNO', 'PADP', 0.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('KNO', 'EVAL', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('KNO', 'AS', 0.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('PRO', 'KP', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PRO', 'PADP', 0.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PRO', 'EVAL', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PRO', 'AS', 0.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('FPA', 'KP', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FPA', 'PADP', 0.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FPA', 'EVAL', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FPA', 'AS', 0.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('FPM', 'KP', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FPM', 'PADP', 0.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FPM', 'EVAL', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FPM', 'AS', 0.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('COM', 'KP', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('COM', 'PADP', 0.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('COM', 'EVAL', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('COM', 'AS', 0.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('WLM', 'KP', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('WLM', 'PADP', 0.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('WLM', 'EVAL', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('WLM', 'AS', 0.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('PSD', 'KP', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PSD', 'PADP', 0.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PSD', 'EVAL', 0.35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PSD', 'AS', 0.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Добавляем остальные компетенции
INSERT INTO "CompetencyWeight" ("competencyCode", "sourceType", "weight", "createdAt", "updatedAt")
SELECT 'LDR', "sourceType", "weight", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "CompetencyWeight"
WHERE "competencyCode" = 'COM'
ON CONFLICT DO NOTHING;

INSERT INTO "CompetencyWeight" ("competencyCode", "sourceType", "weight", "createdAt", "updatedAt")
SELECT 'WSA', "sourceType", "weight", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "CompetencyWeight"
WHERE "competencyCode" = 'COM'
ON CONFLICT DO NOTHING; 