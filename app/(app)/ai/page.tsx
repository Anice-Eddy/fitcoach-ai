import { AIAssistantClient } from '@/components/ai/AIAssistantClient'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'

/** Renders the member-mode AI assistant. */
export default function MemberAIPage() {
  return (
    <>
      <Header title="Assistant IA" />
      <PageWrapper>
        <AIAssistantClient mode="member" />
      </PageWrapper>
    </>
  )
}
