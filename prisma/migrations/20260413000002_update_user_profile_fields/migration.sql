-- Удаляем поля university и company
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "university";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "company";

-- Переименовываем experience в flightHours и меняем тип на Int
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "experience";
ALTER TABLE "UserProfile" ADD COLUMN "flightHours" INTEGER;

-- Добавляем поле aircraftType
ALTER TABLE "UserProfile" ADD COLUMN "aircraftType" TEXT;
