import { HttpClientPort, http } from '../drivers/http'
import { baseURL } from './index'
import { Candidate } from '../interfaces/Candidate'

export interface CandidateRepositoryPort {
  getAllForJobId(jobId: string): Promise<Candidate[]>
  getOneInJobId(jobId: string, candidateId: string): Promise<Candidate>
  updateCandidate(
    jobId: string,
    candidateId: string,
    newStatus: 'new' | 'interview' | 'hired' | 'rejected',
    newPosition: number,
    currentCandidateUpdatedAt: Date,
    user: { name: string; color: string }
  ): Promise<Candidate>
}

export class CandidateRepository implements CandidateRepositoryPort {
  constructor(private readonly httpClient: HttpClientPort = http) {}

  getAllForJobId(jobId: string) {
    return this.httpClient.get<Candidate[]>(`${baseURL}/jobs/${jobId}/candidates`)
  }

  getOneInJobId(jobId: string, candidateId: string) {
    return this.httpClient.get<Candidate>(`${baseURL}/jobs/${jobId}/candidates/${candidateId}`)
  }

  updateCandidate(
    jobId: string,
    candidateId: string,
    newStatus: 'new' | 'interview' | 'hired' | 'rejected',
    newPosition: number,
    currentCandidateUpdatedAt: Date,
    user: { name: string; color: string }
  ) {
    return this.httpClient.put<Candidate>(`${baseURL}/jobs/${jobId}/candidates/${candidateId}`, {
      candidate: {
        status: newStatus,
        position: newPosition,
      },
      user: user,
      current_candidate_updated_at: currentCandidateUpdatedAt,
    })
  }
}
