CREATE TABLE "ai_memories" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "coachId" TEXT,
  "agentType" "AIAgentType" NOT NULL,
  "firstName" TEXT,
  "summary" TEXT,
  "preferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_memories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_memories_userId_memberId_agentType_idx" ON "ai_memories"("userId", "memberId", "agentType");
CREATE INDEX "ai_memories_memberId_agentType_idx" ON "ai_memories"("memberId", "agentType");
CREATE INDEX "ai_memories_coachId_agentType_idx" ON "ai_memories"("coachId", "agentType");
