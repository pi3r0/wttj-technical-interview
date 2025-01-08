import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpClientPort } from '../drivers/http'
import { Candidate } from '../interfaces/Candidate'
import { aCandidate } from '../test/builders/aCandidate.ts'
import { baseURL } from './index'
import { CandidateRepository, GetAllForIdResult } from './CandidateRepository.ts'

// Mock implementation of HttpClientPort
const mockHttpClient = {
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
} satisfies HttpClientPort

describe('JobRepository', () => {
  let repository: CandidateRepository

  beforeEach(() => {
    repository = new CandidateRepository(mockHttpClient)
    vi.clearAllMocks()
  })

  describe('createCandidate', () => {
    it('should create a candidate successfully', async () => {
      const jobId = '123'
      const props = { email: 'test@example.com', status: 'new' }
      const user = { name: 'John Doe', color: '#000000' }
      const expectedCandidate = aCandidate()

      mockHttpClient.post.mockResolvedValue(expectedCandidate)

      await repository.createCandidate(jobId, props, user)

      expect(mockHttpClient.post).toHaveBeenCalledWith(`${baseURL}/jobs/${jobId}/candidates`, {
        props,
        user,
      })
    })
  })

  describe('getAllForJobId', () => {
    it('should call right api endpoint with right params', async () => {
      const jobId = '123'
      const expectedResult: GetAllForIdResult = {
        candidates: [aCandidate().build(), aCandidate().build()],
        has_more: false,
        columns: { new: 1, interview: 1 },
      }

      mockHttpClient.get.mockResolvedValue(expectedResult)

      await repository.getAllForJobId(jobId)

      expect(mockHttpClient.get).toHaveBeenCalledWith(`${baseURL}/jobs/${jobId}/candidates`, {
        limit: 3,
        with_column: true,
      })
    })

    it('should call right api endpoint with right params', async () => {
      const jobId = '123'
      const status = 'new'
      const lastPosition = 500
      const expectedResult: GetAllForIdResult = {
        candidates: [aCandidate().build()],
        has_more: false,
        columns: { new: 1 },
      }

      mockHttpClient.get.mockResolvedValue(expectedResult)

      await repository.getAllForJobId(jobId, status, lastPosition)

      expect(mockHttpClient.get).toHaveBeenCalledWith(`${baseURL}/jobs/${jobId}/candidates`, {
        limit: 3,
        with_column: false,
        status,
        cursor: lastPosition,
      })
    })
  })

  describe('updateCandidate', () => {
    it('should call right api endpoint with right params', async () => {
      const jobId = '123'
      const newStatus = 'interview' as const
      const newPosition = 1500
      const currentCandidateUpdatedAt = new Date()
      const user = { name: 'John Doe', color: '#000000' }
      const expectedCandidate: Candidate = aCandidate().build()

      mockHttpClient.put.mockResolvedValue(expectedCandidate)

      // TODO: cast issues
      await repository.updateCandidate(
        jobId,
        String(expectedCandidate.id),
        newStatus,
        newPosition,
        currentCandidateUpdatedAt,
        user
      )

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `${baseURL}/jobs/${jobId}/candidates/${expectedCandidate.id}`,
        {
          candidate: { status: newStatus, position: newPosition },
          user,
          current_candidate_updated_at: currentCandidateUpdatedAt,
        }
      )
    })
  })
})
