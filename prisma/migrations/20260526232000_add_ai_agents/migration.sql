CREATE TYPE "AIAgentType" AS ENUM ('TRAINING', 'NUTRITION', 'PROGRESSION', 'MOTIVATION', 'COACH_REPORT');
CREATE TYPE "AIProvider" AS ENUM ('GEMINI', 'GROQ');
CREATE TYPE "AIReportType" AS ENUM ('MEMBER_ANALYSIS', 'WORKOUT_PLAN', 'NUTRITION_PLAN', 'COACH_REPORT');

CREATE TABLE "ai_conversations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "coachId" TEXT,
  "agentType" "AIAgentType" NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "coachId" TEXT,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "prompt" TEXT,
  "response" TEXT,
  "provider" "AIProvider",
  "agentType" "AIAgentType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_reports" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "coachId" TEXT,
  "type" "AIReportType" NOT NULL,
  "agentType" "AIAgentType" NOT NULL,
  "prompt" TEXT NOT NULL,
  "response" TEXT NOT NULL,
  "provider" "AIProvider" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_conversations_userId_createdAt_idx" ON "ai_conversations"("userId", "createdAt");
CREATE INDEX "ai_conversations_memberId_createdAt_idx" ON "ai_conversations"("memberId", "createdAt");
CREATE INDEX "ai_conversations_coachId_createdAt_idx" ON "ai_conversations"("coachId", "createdAt");
CREATE INDEX "ai_conversations_agentType_idx" ON "ai_conversations"("agentType");

CREATE INDEX "ai_messages_conversationId_createdAt_idx" ON "ai_messages"("conversationId", "createdAt");
CREATE INDEX "ai_messages_userId_createdAt_idx" ON "ai_messages"("userId", "createdAt");
CREATE INDEX "ai_messages_memberId_createdAt_idx" ON "ai_messages"("memberId", "createdAt");
CREATE INDEX "ai_messages_coachId_createdAt_idx" ON "ai_messages"("coachId", "createdAt");

CREATE INDEX "ai_reports_userId_createdAt_idx" ON "ai_reports"("userId", "createdAt");
CREATE INDEX "ai_reports_memberId_createdAt_idx" ON "ai_reports"("memberId", "createdAt");
CREATE INDEX "ai_reports_coachId_createdAt_idx" ON "ai_reports"("coachId", "createdAt");
CREATE INDEX "ai_reports_type_idx" ON "ai_reports"("type");

ALTER TABLE "ai_messages"
  ADD CONSTRAINT "ai_messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
