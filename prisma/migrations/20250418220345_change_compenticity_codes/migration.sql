-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PILOT', 'INSTRUCTOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AssessmentSourceType" AS ENUM ('KP', 'PADP', 'EVAL', 'AS');

-- CreateEnum
CREATE TYPE "CompetencyCode" AS ENUM ('PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM', 'KNO');

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
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pilot_profileId_key" ON "Pilot"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_profileId_key" ON "Instructor"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyWeight_competencyCode_sourceType_key" ON "CompetencyWeight"("competencyCode", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "PilotCompetencyScore_pilotId_competencyCode_sourceType_key" ON "PilotCompetencyScore"("pilotId", "competencyCode", "sourceType");

-- AddForeignKey
ALTER TABLE "Pilot" ADD CONSTRAINT "Pilot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotCompetencyScore" ADD CONSTRAINT "PilotCompetencyScore_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotCompetencyScore" ADD CONSTRAINT "PilotCompetencyScore_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
