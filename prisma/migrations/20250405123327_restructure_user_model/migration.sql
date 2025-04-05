/*
  Warnings:

  - You are about to drop the column `userId` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Exercise` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `instructorId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pilotId` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/

-- Создаем временную таблицу для хранения данных о связях оценок
CREATE TABLE "_TempAssessmentLinks" (
    "id" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL
);

-- Сохраняем данные о связях оценок и пользователей
INSERT INTO "_TempAssessmentLinks" ("id", "userId")
SELECT "id", "userId" FROM "Assessment";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_sessionId_fkey";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "userId",
ADD COLUMN     "instructorId" INTEGER,
ADD COLUMN     "pilotId" INTEGER;

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Exercise";

-- DropTable
DROP TABLE "Session";

-- Сохраняем пользователей перед удалением таблицы
CREATE TABLE "_TempUsers" AS
SELECT * FROM "User";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "university" TEXT,
    "company" TEXT,
    "role" "UserRole" NOT NULL,
    "experience" TEXT,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "superAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pilot" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pilot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pilot_profileId_key" ON "Pilot"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_profileId_key" ON "Instructor"("profileId");

-- Перенос данных пользователей в новую структуру
INSERT INTO "UserProfile" ("id", "email", "password", "firstName", "lastName", "birthDate", "university", "company", "role", "experience", "position", "createdAt", "updatedAt")
SELECT "id", "email", "password", "firstName", "lastName", "birthDate", "university", "company", "role", "experience", "position", "createdAt", "updatedAt"
FROM "_TempUsers";

-- Создание записей пилотов
INSERT INTO "Pilot" ("profileId", "createdAt", "updatedAt")
SELECT "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "_TempUsers"
WHERE "role" = 'PILOT';

-- Создание записей инструкторов
INSERT INTO "Instructor" ("profileId", "createdAt", "updatedAt")
SELECT "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "_TempUsers"
WHERE "role" = 'INSTRUCTOR';

-- Обновляем связи оценок с пилотами и инструкторами
UPDATE "Assessment" a
SET "pilotId" = p.id
FROM "Pilot" p
JOIN "_TempUsers" tu ON p."profileId" = tu.id
JOIN "_TempAssessmentLinks" tal ON tal."userId" = tu.id
WHERE a.id = tal.id AND tu.role = 'PILOT';

-- Установка instructorId (для простоты выбираем первого инструктора)
UPDATE "Assessment" a
SET "instructorId" = (SELECT id FROM "Instructor" LIMIT 1)
WHERE "instructorId" IS NULL;

-- Удаляем временные таблицы
DROP TABLE "_TempUsers";
DROP TABLE "_TempAssessmentLinks";

-- Делаем колонки NOT NULL после заполнения данными
ALTER TABLE "Assessment" ALTER COLUMN "pilotId" SET NOT NULL;
ALTER TABLE "Assessment" ALTER COLUMN "instructorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Pilot" ADD CONSTRAINT "Pilot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
