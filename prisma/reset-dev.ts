/**
 * Script de remise à zéro des données en développement.
 * Supprime tous les utilisateurs et données liées dans le bon ordre.
 * NE PAS utiliser en production.
 *
 * Usage : npx tsx prisma/reset-dev.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Ce script ne peut pas tourner en production.')
    process.exit(1)
  }

  console.log('🧹 Nettoyage de la base de données...')

  // Ordre important : enfants avant parents
  await prisma.aIMessage.deleteMany()
  await prisma.aIMemory.deleteMany()
  await prisma.aIReport.deleteMany()
  await prisma.aIUsageDaily.deleteMany()
  await prisma.aIConversation.deleteMany()

  await prisma.coachNoteReply.deleteMany()
  await prisma.coachNote.deleteMany()
  await prisma.coachAppointment.deleteMany()
  await prisma.coachAvailability.deleteMany()
  await prisma.coachMember.deleteMany()
  await prisma.coachProfile.deleteMany()

  await prisma.exerciseLog.deleteMany()
  await prisma.workoutSession.deleteMany()
  await prisma.workoutProgram.deleteMany()

  await prisma.foodItem.deleteMany()
  await prisma.meal.deleteMany()
  await prisma.nutritionPlan.deleteMany()
  await prisma.shoppingList.deleteMany()

  await prisma.bodyMetric.deleteMany()
  await prisma.userNote.deleteMany()
  await prisma.exportHistory.deleteMany()
  await prisma.integrationAccount.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.notification.deleteMany()

  await prisma.affiliateClick.deleteMany()

  await prisma.subscription.deleteMany()
  await prisma.profile.deleteMany()

  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Base de données remise à zéro. Tu peux recréer un compte.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
