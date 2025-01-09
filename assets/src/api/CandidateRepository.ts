import { HttpClientPort, http } from '../drivers/http'
import { baseURL } from './index'
import { Candidate } from '../interfaces/Candidate'

export interface GetAllForIdResult {
  candidates: Candidate[]
  has_more: boolean
  columns: Record<string, number>
}

export interface CandidateRepositoryPort {
  createCandidate(
    jobId: string,
    props: { email: string; status: string },
    user: { name: string; color: string }
  ): Promise<Candidate>
  getAllForJobId(jobId: string, status?: string, lastPosition?: number): Promise<GetAllForIdResult>
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

  createCandidate(
    jobId: string,
    props: { email: string; status: string },
    user: { name: string; color: string }
  ): Promise<Candidate> {
    return this.httpClient.post<Candidate>(`${baseURL}/jobs/${jobId}/candidates`, { props, user })
  }

  getAllForJobId(
    jobId: string,
    status?: string,
    lastPosition?: number
  ): Promise<GetAllForIdResult> {
    const params: {
      status?: string
      cursor?: number
      with_column?: boolean
      limit?: number
    } = {
      limit: 3,
      with_column: true,
    }

    if (status) {
      params.status = status
      params.cursor = lastPosition ?? 0
      params.with_column = false
    }

    return this.httpClient.get<GetAllForIdResult>(`${baseURL}/jobs/${jobId}/candidates`, params)
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
