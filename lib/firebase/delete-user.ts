import { firebaseAdminAuth } from '@/lib/firebase/admin'

/** Deletes the external auth identity; missing users are already effectively deleted. */
export async function deleteExternalAuthUser(firebaseUid: string) {
  try {
    await firebaseAdminAuth().deleteUser(firebaseUid)
    return { deleted: true }
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'auth/user-not-found') {
      return { deleted: false, alreadyMissing: true }
    }
    throw error
  }
}
