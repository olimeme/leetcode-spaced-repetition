export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Grade = 'easy' | 'medium' | 'hard'

export interface Problem {
  id: string
  title: string
  url: string
  slug: string
  difficulty: Difficulty | null
  topics: string[]
  /** ISO date the problem was first added to the list */
  dateAdded: string
  /** ISO date it was last marked solved, or null if never solved */
  lastSolved: string | null
  /** Current spaced-repetition interval in days (0 until first solve) */
  intervalDays: number
  /** ISO date it next becomes due for revisit, or null if in backlog */
  dueDate: string | null
  /** How many times it has been solved */
  solvedCount: number
}
