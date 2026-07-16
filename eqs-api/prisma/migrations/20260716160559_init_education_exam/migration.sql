-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "edu";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "exam";

-- CreateTable
CREATE TABLE "edu"."subjects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edu"."topics" (
    "id" SERIAL NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edu"."quizzes" (
    "id" SERIAL NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passing_percentage" DECIMAL(5,2) NOT NULL DEFAULT 60,
    "time_limit_minutes" INTEGER,
    "is_show_answer" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edu"."questions" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "explanation" TEXT,
    "score" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edu"."question_choices" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "choice_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam"."quiz_attempts" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_passed" BOOLEAN,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam"."user_answers" (
    "id" SERIAL NOT NULL,
    "quiz_attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_choice_id" INTEGER,
    "is_correct" BOOLEAN,
    "score_received" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "edu"."subjects"("name");

-- CreateIndex
CREATE INDEX "topics_subject_id_idx" ON "edu"."topics"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_subject_id_name_key" ON "edu"."topics"("subject_id", "name");

-- CreateIndex
CREATE INDEX "quizzes_topic_id_idx" ON "edu"."quizzes"("topic_id");

-- CreateIndex
CREATE INDEX "quizzes_status_idx" ON "edu"."quizzes"("status");

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "edu"."questions"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_quiz_id_sort_order_key" ON "edu"."questions"("quiz_id", "sort_order");

-- CreateIndex
CREATE INDEX "question_choices_question_id_idx" ON "edu"."question_choices"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_choices_question_id_sort_order_key" ON "edu"."question_choices"("question_id", "sort_order");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "exam"."quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "exam"."quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_status_idx" ON "exam"."quiz_attempts"("status");

-- CreateIndex
CREATE INDEX "user_answers_quiz_attempt_id_idx" ON "exam"."user_answers"("quiz_attempt_id");

-- CreateIndex
CREATE INDEX "user_answers_question_id_idx" ON "exam"."user_answers"("question_id");

-- CreateIndex
CREATE INDEX "user_answers_selected_choice_id_idx" ON "exam"."user_answers"("selected_choice_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_answers_quiz_attempt_id_question_id_key" ON "exam"."user_answers"("quiz_attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "edu"."topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "edu"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edu"."quizzes" ADD CONSTRAINT "quizzes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "edu"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edu"."questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "edu"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edu"."question_choices" ADD CONSTRAINT "question_choices_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "edu"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "edu"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam"."user_answers" ADD CONSTRAINT "user_answers_quiz_attempt_id_fkey" FOREIGN KEY ("quiz_attempt_id") REFERENCES "exam"."quiz_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam"."user_answers" ADD CONSTRAINT "user_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "edu"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam"."user_answers" ADD CONSTRAINT "user_answers_selected_choice_id_fkey" FOREIGN KEY ("selected_choice_id") REFERENCES "edu"."question_choices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
