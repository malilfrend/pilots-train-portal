-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseCompetency" (
    "exerciseId" INTEGER NOT NULL,
    "competencyCode" "CompetencyCode" NOT NULL,

    CONSTRAINT "ExerciseCompetency_pkey" PRIMARY KEY ("exerciseId","competencyCode")
);

-- CreateIndex
CREATE INDEX "ExerciseCompetency_competencyCode_idx" ON "ExerciseCompetency"("competencyCode");

-- AddForeignKey
ALTER TABLE "ExerciseCompetency" ADD CONSTRAINT "ExerciseCompetency_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
