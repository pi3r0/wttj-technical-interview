import { renderHook, act } from '@testing-library/react-hooks'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useJobShowVM } from './JobShowVM.ts'
import type { Candidate } from '../interfaces/Candidate.ts'
import { HttpClientPort } from '../drivers/http.ts'

// Mock data
const mockJob = {
  id: '1',
  name: 'Software Engineer',
}

const mockCandidates: Candidate[] = [
  { id: 1, email: 'user1@test.com', status: 'new', position: 2000 },
  { id: 2, email: 'user2@test.com', status: 'interview', position: 1000 },
  { id: 3, email: 'user3@test.com', status: 'new', position: 1000 },
]

const mockHttpClient = {
  get: vi.fn(),
  put: vi.fn(),
} satisfies HttpClientPort

describe('JobViewVm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('should return error when jobId is not provided', async () => {
      const { result } = renderHook(() => useJobShowVM(undefined, mockHttpClient))

      expect(result.current).toMatchObject({
        isLoading: false,
        hasError: true,
        error: 'Job ID is required',
        jobName: 'Not Found',
      })
    })

    it('Should return load state', () => {
      const { result } = renderHook(() => useJobShowVM('1', mockHttpClient))

      expect(result.current).toMatchObject({
        isLoading: true,
        hasError: false,
        error: '',
        jobName: 'Not Found',
      })
    })

    it('should load job and candidates successfully', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(mockCandidates)

      const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

      expect(result.current.isLoading).toBe(true)

      await waitForNextUpdate()

      expect(result.current).toMatchObject({
        isLoading: false,
        hasError: false,
        error: '',
        jobName: mockJob.name,
        groupedCandidates: [
          {
            id: 'new',
            name: 'New',
            candidatesCount: 2,
            candidates: [mockCandidates[2], mockCandidates[0]],
          },
          {
            id: 'interview',
            name: 'Interview',
            candidatesCount: mockCandidates.filter((c: Candidate) => c.status === 'interview')
              .length,
            candidates: [mockCandidates[1]],
          },
          { id: 'hired', name: 'Hired', candidatesCount: 0, candidates: [] },
          { id: 'rejected', name: 'Rejected', candidatesCount: 0, candidates: [] },
        ],
      })

      expect(result.current.groupedCandidates).length(4)
      expect(result.current.groupedCandidates[0].candidates).length(2) // new status
      expect(result.current.groupedCandidates[1].candidates).length(1) // interview status
    })
  })

  it('should handle job fetch error', async () => {
    mockHttpClient.get
      .mockRejectedValueOnce(new Error('Job not found'))
      .mockResolvedValueOnce(mockCandidates)

    const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

    await waitForNextUpdate()

    expect(result.current).toMatchObject({
      isLoading: false,
      hasError: true,
      error: 'Job 1 not found',
    })
  })

  it('should handle candidates fetch error', async () => {
    mockHttpClient.get
      .mockResolvedValueOnce(mockCandidates)
      .mockRejectedValueOnce(new Error('Candidates for this job not found'))

    const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

    await waitForNextUpdate()

    expect(result.current).toMatchObject({
      isLoading: false,
      hasError: true,
      error: "Candidates for job 1 can't be retrieve",
    })
  })
})

describe('updateCandidateStatus', () => {
  it('should throw when no job has been found ', async () => {
    mockHttpClient.get
      .mockRejectedValueOnce(new Error('Job not found'))
      .mockResolvedValueOnce(mockCandidates)

    const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

    await waitForNextUpdate()

    await act(async () => {
      try {
        await result.current.updateCandidateStatus(1, 'interview', 0)
      } catch (error) {
        expect((error as Error).message).to.equal('Job ID is required')
      }
    })
  })

  it('should throw when no candidate has not been found ', async () => {
    mockHttpClient.get.mockResolvedValueOnce(mockJob).mockResolvedValueOnce([])

    const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

    await waitForNextUpdate()

    await act(async () => {
      try {
        await result.current.updateCandidateStatus(1, 'interview', 0)
      } catch (error) {
        expect((error as Error).message).to.equal('Candidate 1 not found on the list')
      }
    })
  })

  it('should do nothing when targeted position and status are the same ', async () => {
    mockHttpClient.get.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(mockCandidates)

    const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

    await waitForNextUpdate()

    await act(async () => {
      await result.current.updateCandidateStatus(mockCandidates[0].id, mockCandidates[0].status, 1)
    })

    expect(mockHttpClient.put).not.toBeCalled()
  })

  it('should update candidate status and position successfully', async () => {
    mockHttpClient.get.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(mockCandidates)

    mockHttpClient.put.mockResolvedValueOnce({})

    const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

    await waitForNextUpdate()

    await act(async () => {
      await result.current.updateCandidateStatus(1, 'interview', 0)
    })

    // Check if candidate was moved to interview status
    const interviewGroup = result.current.groupedCandidates[1]
    expect(interviewGroup.candidates).length(2)
    expect(interviewGroup.candidates[0].id).toBe(1)
  })

  it('should handle update error and revert changes', async () => {
    mockHttpClient.get.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(mockCandidates)

    mockHttpClient.put.mockRejectedValueOnce(new Error('Update failed'))

    const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

    await waitForNextUpdate()

    const originalState = result.current.groupedCandidates

    await act(async () => {
      await result.current.updateCandidateStatus(1, 'interview', 0)
    })

    expect(result.current.hasError).toBe(true)
    expect(result.current.error).toBe('Error: status cannot be changed')

    // Verify the state was reverted
    expect(result.current.groupedCandidates).toEqual(originalState)
  })

  describe('Position Calculation', () => {
    it('should set position to 1000 for first item in empty group', async () => {
      const candidates = [{ id: 1, email: 'user1@test.com', status: 'new', position: 1000 }]

      mockHttpClient.get.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(candidates)

      mockHttpClient.put.mockResolvedValueOnce({})

      const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

      await waitForNextUpdate()

      await act(async () => {
        await result.current.updateCandidateStatus(1, 'interview', 0)
      })

      const interviewGroup = result.current.groupedCandidates[1]
      expect(interviewGroup.candidates[0].position).toBe(1000)
    })

    it('should calculate middle position between two candidates', async () => {
      const candidates = [
        { id: 1, email: 'user1@test.com', status: 'interview', position: 1000 },
        { id: 2, email: 'user2@test.com', status: 'interview', position: 3000 },
        { id: 3, email: 'user3@test.com', status: 'new', position: 1000 },
      ]

      mockHttpClient.get.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(candidates)

      mockHttpClient.put.mockResolvedValueOnce({})

      const { result, waitForNextUpdate } = renderHook(() => useJobShowVM('1', mockHttpClient))

      await waitForNextUpdate()

      await act(async () => {
        await result.current.updateCandidateStatus(3, 'interview', 1)
      })

      const interviewGroup = result.current.groupedCandidates[1]
      expect(interviewGroup.candidates[1].position).toBe(2000) // Middle between 1000 and 3000
    })
  })
})
