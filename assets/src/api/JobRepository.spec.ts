import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JobRepository } from './JobRepository.ts'
import { HttpClientPort } from '../drivers/http'
import { baseURL } from './index'
import { aJob } from '../test/builders/aJob.ts'

// Mock implementation of HttpClientPort
const mockHttpClient = {
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
} satisfies HttpClientPort

describe('CandidateRepository', () => {
  let repository: JobRepository

  beforeEach(() => {
    repository = new JobRepository(mockHttpClient)
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should call right api endpoint', async () => {
      const jobs = [aJob().build()]

      mockHttpClient.get.mockResolvedValue(jobs)

      await repository.getAll()

      expect(mockHttpClient.get).toHaveBeenCalledWith(`${baseURL}/jobs`)
    })
  })

  describe('getOne', () => {
    it('should call right api endpoint', async () => {
      const job = aJob().build()

      mockHttpClient.get.mockResolvedValue(job)

      await repository.getOne(job.id)

      expect(mockHttpClient.get).toHaveBeenCalledWith(`${baseURL}/jobs/${job.id}`)
    })
  })
})
