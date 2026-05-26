// Route handler NextAuth — gère GET et POST pour tous les endpoints OAuth
import { handlers } from '@/lib/auth/auth'

export const runtime = 'nodejs'
export const { GET, POST } = handlers
