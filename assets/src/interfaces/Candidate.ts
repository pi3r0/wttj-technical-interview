export type Statuses = 'new' | 'interview' | 'hired' | 'rejected'

export interface Candidate {
  id: number
  email: string
  status: Statuses
  position: number
  updated_at: Date
}
