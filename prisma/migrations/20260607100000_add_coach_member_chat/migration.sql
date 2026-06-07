CREATE TABLE "coach_chats" (
  "id" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "coach_chats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coach_chat_messages" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "coach_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coach_chats_coachId_memberId_key" ON "coach_chats"("coachId", "memberId");
CREATE INDEX "coach_chats_coachId_lastMessageAt_idx" ON "coach_chats"("coachId", "lastMessageAt");
CREATE INDEX "coach_chats_memberId_lastMessageAt_idx" ON "coach_chats"("memberId", "lastMessageAt");
CREATE INDEX "coach_chat_messages_chatId_createdAt_idx" ON "coach_chat_messages"("chatId", "createdAt");
CREATE INDEX "coach_chat_messages_senderUserId_idx" ON "coach_chat_messages"("senderUserId");

ALTER TABLE "coach_chats"
  ADD CONSTRAINT "coach_chats_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coach_chats"
  ADD CONSTRAINT "coach_chats_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coach_chat_messages"
  ADD CONSTRAINT "coach_chat_messages_chatId_fkey"
  FOREIGN KEY ("chatId") REFERENCES "coach_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coach_chat_messages"
  ADD CONSTRAINT "coach_chat_messages_senderUserId_fkey"
  FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
