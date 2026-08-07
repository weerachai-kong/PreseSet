-- CreateEnum
CREATE TYPE "ProgramMode" AS ENUM ('INTERVAL', 'REPS_SETS');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'th');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "beep_enabled" BOOLEAN NOT NULL DEFAULT true,
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "water_reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "water_reminder_interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_by" VARCHAR(255) NOT NULL,
    "update_date" TIMESTAMP(3),
    "update_by" VARCHAR(255),
    "is_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "ProgramMode" NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_by" VARCHAR(255) NOT NULL,
    "update_date" TIMESTAMP(3),
    "update_by" VARCHAR(255),
    "is_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_steps" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT,
    "media_url" TEXT,
    "work_seconds" INTEGER,
    "rest_seconds" INTEGER,
    "rounds" INTEGER,
    "reps" INTEGER,
    "sets" INTEGER,
    "rest_between_sets_seconds" INTEGER,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_by" VARCHAR(255) NOT NULL,
    "update_date" TIMESTAMP(3),
    "update_by" VARCHAR(255),
    "is_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "exercise_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_days" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "program_id" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_by" VARCHAR(255) NOT NULL,
    "update_date" TIMESTAMP(3),
    "update_by" VARCHAR(255),
    "is_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "program_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT,
    "mode" "ProgramMode" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "summary_json" JSONB,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_by" VARCHAR(255) NOT NULL,
    "update_date" TIMESTAMP(3),
    "update_by" VARCHAR(255),
    "is_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "programs_user_id_idx" ON "programs"("user_id");

-- CreateIndex
CREATE INDEX "programs_is_delete_idx" ON "programs"("is_delete");

-- CreateIndex
CREATE INDEX "exercise_steps_program_id_idx" ON "exercise_steps"("program_id");

-- CreateIndex
CREATE INDEX "program_days_user_id_idx" ON "program_days"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_days_user_id_day_of_week_key" ON "program_days"("user_id", "day_of_week");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_idx" ON "workout_sessions"("user_id");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_steps" ADD CONSTRAINT "exercise_steps_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

