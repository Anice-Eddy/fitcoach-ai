import { describe, expect, it } from 'vitest'
import { buildMemoryInstruction, extractMemorySignals } from '@/lib/ai/memory'

describe('AI memory helpers', () => {
  it('extrait les préférences et les sujets depuis un message utilisateur', () => {
    const signals = extractMemorySignals("Je préfère les séances courtes et j'aime travailler les charges lourdes en progression")

    expect(signals.topics).toContain('entraînement')
    expect(signals.topics).toContain('progression')
    expect(signals.preferences.join(' ')).toContain('les séances courtes')
  })

  it('force une conversation continue sans salutations répétitives', () => {
    const instruction = buildMemoryInstruction({
      firstName: 'Eddy',
      recentMessages: [{ role: 'user', content: 'On parlait de mon programme push pull legs', createdAt: new Date() }],
      memory: {
        id: 'memory_1',
        userId: 'user_1',
        memberId: 'member_1',
        coachId: null,
        agentType: 'TRAINING',
        firstName: 'Eddy',
        summary: 'Dernier sujet: programme push pull legs.',
        preferences: ['séances courtes'],
        topics: ['entraînement'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    expect(instruction).toContain('conversation continue')
    expect(instruction).toContain('Ne dis pas "Bonjour"')
    expect(instruction).toContain('Préférences mémorisées: séances courtes')
  })
})
