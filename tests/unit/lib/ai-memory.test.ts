import { describe, expect, it } from 'vitest'
import { buildMemoryInstruction, extractMemorySignals } from '@/lib/ai/memory'

describe('AI memory helpers', () => {
  it('extracts preferences and topics from a user message', () => {
    const signals = extractMemorySignals("Je préfère les séances courtes et j'aime travailler les charges lourdes en progression")

    expect(signals.topics).toContain('training')
    expect(signals.topics).toContain('progression')
    expect(signals.preferences.join(' ')).toContain('les séances courtes')
  })

  it('enforces an ongoing conversation without repetitive greetings', () => {
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
        topics: ['training'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    expect(instruction).toContain('ongoing conversation')
    expect(instruction).toContain('Do not say "Hello"')
    expect(instruction).toContain('Remembered preferences: séances courtes')
  })
})
