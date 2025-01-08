import type { Candidate } from '../../interfaces/Candidate'

class CandidateBuilder {
  candidate: Candidate

  constructor(candidate?: Partial<Candidate>) {
    this.candidate = {
      id: 1,
      email: 'test@test.com',
      status: 'new',
      position: 1000,
      updated_at: new Date(),
      ...candidate,
    }
  }

  build() {
    return this.candidate
  }
}

export const aCandidate = (candidate?: Partial<Candidate>) => new CandidateBuilder(candidate)
