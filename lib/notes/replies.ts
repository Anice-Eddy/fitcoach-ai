import { prisma } from '@/lib/prisma/client'

export type NormalizedCoachNoteReply = {
  id: string
  noteId: string
  memberId: string | null
  authorUserId: string | null
  authorRole: string
  content: string
  createdAt: Date
  updatedAt: Date
  member: {
    name: string | null
    image: string | null
  } | null
}

/** Reads note replies with author fields using SQL so dev servers with a stale Prisma Client stay compatible. */
export async function getNormalizedCoachNoteReplies(noteId: string) {
  const rows = await prisma.$queryRaw<Array<{
    id: string
    noteId: string
    memberId: string | null
    authorUserId: string | null
    authorRole: string | null
    content: string
    createdAt: Date
    updatedAt: Date
    memberName: string | null
    memberImage: string | null
  }>>`
    SELECT
      r."id",
      r."noteId",
      r."memberId",
      r."authorUserId",
      r."authorRole",
      r."content",
      r."createdAt",
      r."updatedAt",
      u."name" AS "memberName",
      u."image" AS "memberImage"
    FROM "coach_note_replies" r
    LEFT JOIN "users" u ON u."id" = r."memberId"
    WHERE r."noteId" = ${noteId}
    ORDER BY r."createdAt" ASC
  `

  return rows.map<NormalizedCoachNoteReply>((row) => ({
    id: row.id,
    noteId: row.noteId,
    memberId: row.memberId,
    authorUserId: row.authorUserId,
    authorRole: row.authorRole ?? 'MEMBER',
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    member: row.memberId
      ? { name: row.memberName, image: row.memberImage }
      : null,
  }))
}

/** Stores author metadata with SQL after a minimal Prisma create, avoiding stale-client validation errors. */
export async function attachReplyAuthor(replyId: string, authorUserId: string, authorRole: 'MEMBER' | 'COACH') {
  await prisma.$executeRaw`
    UPDATE "coach_note_replies"
    SET "authorUserId" = ${authorUserId},
        "authorRole" = ${authorRole}
    WHERE "id" = ${replyId}
  `
}
