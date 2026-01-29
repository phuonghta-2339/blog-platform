-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "to" VARCHAR(255) NOT NULL,
    "template" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "job_id" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_to_idx" ON "email_logs"("to");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");
