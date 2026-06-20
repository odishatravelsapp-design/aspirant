import type { Question } from '../types'

// PYQ pattern analysis: which topics recur most across past papers (high
// "weightage" = most likely to be asked again), and a predicted-importance
// practice set biased toward those topics.

export type Probability = 'high' | 'medium' | 'low'

export interface TopicWeight {
  topic: string
  count: number // how many questions in this topic
  years: number[] // distinct years it appeared in
  share: number // 0..1 of the whole bank
  prob: Probability
}

export function topicWeightage(questions: Question[]): TopicWeight[] {
  const map = new Map<string, { count: number; years: Set<number> }>()
  for (const q of questions) {
    const cur = map.get(q.topic) ?? { count: 0, years: new Set<number>() }
    cur.count++
    if (typeof q.year === 'number') cur.years.add(q.year)
    map.set(q.topic, cur)
  }
  const total = questions.length || 1
  const max = Math.max(1, ...[...map.values()].map((v) => v.count))
  return [...map.entries()]
    .map(([topic, v]) => {
      const ratio = v.count / max
      const prob: Probability = ratio >= 0.66 ? 'high' : ratio >= 0.33 ? 'medium' : 'low'
      return { topic, count: v.count, years: [...v.years].sort(), share: v.count / total, prob }
    })
    .sort((a, b) => b.count - a.count)
}

// Topics that recurred — asked more than once or across multiple years.
export function repeatedTopics(weights: TopicWeight[]): TopicWeight[] {
  return weights.filter((w) => w.count >= 2 || w.years.length >= 2)
}

// Predicted-importance practice: sample questions biased toward high-weightage
// topics (what's historically most likely to appear), without being fully
// deterministic so repeated sessions vary.
export function predictedQuestions(questions: Question[], limit: number): Question[] {
  const weights = topicWeightage(questions)
  // Rank: most-frequent topic gets the highest weight.
  const rank = new Map(weights.map((w, i) => [w.topic, weights.length - i]))
  return [...questions]
    .map((q) => ({ q, score: (rank.get(q.topic) ?? 1) * (0.5 + Math.random()) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.q)
}
