import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react-hooks'
import { useCandidateCreateVM } from './viewModel'
import { HttpClientPort } from '../../drivers/http'
import { Column } from '../../hooks/JobShowVM.ts'
import { aCandidate } from '../../test/builders/aCandidate.ts'
import { baseURL } from '../../api'

const mockColumns: Column[] = [
  {
    id: 'new',
    name: 'New',
    candidatesCount: 0,
    candidates: [],
    hasMoreCandidates: false,
    lastPosition: 0,
  },
  {
    id: 'interview',
    name: 'Interview',
    candidatesCount: 0,
    candidates: [],
    hasMoreCandidates: false,
    lastPosition: 1000,
  },
]
const mockUser = { name: 'John Doe', color: '#000000' }
const mockJobId = '123'

const mockHttpClient = {
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
} satisfies HttpClientPort

describe('useCandidateCreateVM', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Init', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
      )

      expect(result.current.options).toEqual([
        { value: 'new', label: 'New' },
        { value: 'interview', label: 'Interview' },
      ])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.formIsDisabled).toBe(true)
      expect(result.current.hasError).toBe(false)
      expect(result.current.emailError).toBe('')
      expect(result.current.status).toBe('new')
      expect(result.current.statusError).toBe('')
      expect(result.current.formError).toBe('')
    })
  })

  describe('emailHasChanged', () => {
    it('should update email state when email is unvalid', () => {
      const { result } = renderHook(() =>
        useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
      )

      act(() => {
        result.current.emailHasChanged('invalid-email')
      })

      expect(result.current.emailError).toBe('Email must be valid')
    })

    it('should update email state when email is valid', () => {
      const { result } = renderHook(() =>
        useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
      )

      act(() => {
        result.current.emailHasChanged('valid@email.com')
      })

      expect(result.current.emailError).toBe('')
    })
  })

  describe('statusHasChanged', () => {
    it('should update status state when status is valid', () => {
      const { result } = renderHook(() =>
        useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
      )

      act(() => {
        result.current.columnHasChanged('interview')
      })

      expect(result.current.status).toBe('interview')
      expect(result.current.statusError).toBe('')
    })
    it('should update status state when status is invalid', () => {
      const { result } = renderHook(() =>
        useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
      )

      act(() => {
        result.current.columnHasChanged('new')
      })

      expect(result.current.status).toBe('new')
      expect(result.current.statusError).toBe('')
    })
  })
  describe('submit', () => {
    it('should submit form successfully', async () => {
      const expectedCandidate = aCandidate().build()
      mockHttpClient.post.mockResolvedValue(expectedCandidate)

      const { result } = renderHook(() =>
        useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
      )

      act(() => {
        result.current.emailHasChanged('valid@email.com')
        result.current.columnHasChanged('new')
      })

      await act(async () => {
        await result.current.submit()
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(`${baseURL}/jobs/123/candidates`, {
        props: { email: 'valid@email.com', status: 'new' },
        user: mockUser,
      })
      expect(result.current.formError).toBe('')
    })

    it('should handle submission errors', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('409'))

      const { result } = renderHook(() =>
        useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
      )

      act(() => {
        result.current.emailHasChanged('valid@email.com')
        result.current.columnHasChanged('new')
      })

      await act(async () => {
        await result.current.submit()
      })

      expect(result.current.formError).toBe('Email address already exists')
    })
  })

  it('should reset state', () => {
    const { result } = renderHook(() =>
      useCandidateCreateVM(true, mockColumns, mockUser, mockJobId, mockHttpClient)
    )

    act(() => {
      result.current.emailHasChanged('valid@email.com')
      result.current.columnHasChanged('interview')
    })

    act(() => {
      result.current.resetState()
    })

    expect(result.current.status).toBe('new')
    expect(result.current.emailError).toBe('')
    expect(result.current.statusError).toBe('')
    expect(result.current.formError).toBe('')
  })
})
