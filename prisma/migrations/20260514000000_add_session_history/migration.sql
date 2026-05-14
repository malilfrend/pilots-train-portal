-- Создание новых таблиц Session, SessionScore, SessionExercise; backfill из PilotCompetencyScore; удаление старой таблицы.

CREATE TABLE "Session" (
  "id" SERIAL PRIMARY KEY,
  "instructorId" INTEGER NOT NULL,
  "pilot1Id" INTEGER NOT NULL,
  "pilot2Id" INTEGER NOT NULL,
  "totalTime" INTEGER NOT NULL,
  "totalValue" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isLegacy" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Session_pilot1Id_fkey"    FOREIGN KEY ("pilot1Id")    REFERENCES "Pilot"("id")      ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Session_pilot2Id_fkey"    FOREIGN KEY ("pilot2Id")    REFERENCES "Pilot"("id")      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Session_pilot1Id_idx"     ON "Session" ("pilot1Id");
CREATE INDEX "Session_pilot2Id_idx"     ON "Session" ("pilot2Id");
CREATE INDEX "Session_instructorId_idx" ON "Session" ("instructorId");
CREATE INDEX "Session_date_idx"         ON "Session" ("date");

CREATE TABLE "SessionScore" (
  "id" SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL,
  "pilotId" INTEGER NOT NULL,
  "competencyCode" "CompetencyCode" NOT NULL,
  "score" INTEGER NOT NULL,
  "comment" TEXT,
  CONSTRAINT "SessionScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessionScore_pilotId_fkey"   FOREIGN KEY ("pilotId")   REFERENCES "Pilot"("id")    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SessionScore_sessionId_pilotId_competencyCode_key"
  ON "SessionScore" ("sessionId", "pilotId", "competencyCode");
CREATE INDEX "SessionScore_pilotId_competencyCode_idx"
  ON "SessionScore" ("pilotId", "competencyCode");

CREATE TABLE "SessionExercise" (
  "id" SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL,
  "order" INTEGER NOT NULL,
  "exerciseId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "executionTime" INTEGER NOT NULL,
  "value" INTEGER NOT NULL,
  "pilot" INTEGER,
  "role" TEXT,
  CONSTRAINT "SessionExercise_sessionId_fkey"  FOREIGN KEY ("sessionId")  REFERENCES "Session"("id")  ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SessionExercise_sessionId_order_key"
  ON "SessionExercise" ("sessionId", "order");
CREATE INDEX "SessionExercise_exerciseId_idx"
  ON "SessionExercise" ("exerciseId");

-- Backfill: для каждого пилота с историей оценок создаём legacy-сессию,
-- инструктор и дата берутся из самой свежей записи в PilotCompetencyScore.
INSERT INTO "Session" ("instructorId", "pilot1Id", "pilot2Id", "totalTime", "totalValue", "date", "isLegacy")
SELECT DISTINCT ON (pcs."pilotId")
  pcs."instructorId",
  pcs."pilotId" AS "pilot1Id",
  pcs."pilotId" AS "pilot2Id",
  0 AS "totalTime",
  0 AS "totalValue",
  pcs."date",
  true AS "isLegacy"
FROM "PilotCompetencyScore" pcs
ORDER BY pcs."pilotId", pcs."date" DESC, pcs."id" DESC;

-- Копируем оценки в SessionScore, привязывая к созданной legacy-сессии пилота.
INSERT INTO "SessionScore" ("sessionId", "pilotId", "competencyCode", "score", "comment")
SELECT s."id", pcs."pilotId", pcs."competencyCode", pcs."score", pcs."comment"
FROM "PilotCompetencyScore" pcs
JOIN "Session" s
  ON s."isLegacy" = true
 AND s."pilot1Id" = pcs."pilotId"
 AND s."pilot2Id" = pcs."pilotId";

DROP TABLE "PilotCompetencyScore";
