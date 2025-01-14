import { useState, useEffect, useMemo } from 'react'
import { isRejected, isFulfilled } from '../utils/promise.ts'
import { CandidateRepository } from '../api/CandidateRepository'
import { JobRepository } from '../api/JobRepository'
import { Candidate, Statuses } from '../interfaces/Candidate'
import { http, HttpClientPort } from '../drivers/http.ts'
import { calculateNewPosition } from '../utils/position.ts'

export interface Column {
  id: Statuses
  name: string
  candidatesCount: number
  candidates: Candidate[]
  hasMoreCandidates: boolean
  lastPosition: number
}

interface JobShowState {
  isLoading: boolean
  error: string | null
  job: {
    id: string
    name: string
  } | null
  candidates: Candidate[]
  columns: Record<string, number>
  user: { name: string; color: string } | null
}

const INITIAL_STATE: JobShowState = {
  isLoading: false,
  error: null,
  job: null,
  candidates: [],
  columns: {},
  user: null,
}

interface EventUpdate {
  type: 'candidate_updated'
  data: {
    kind: 'add' | 'update'
    candidate: Candidate
    user: { name: string; color: string }
    columns: Record<string, number>
  }
}

const COLUMN_DEFINITIONS: Column[] = [
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
    lastPosition: 0,
  },
  {
    id: 'hired',
    name: 'Hired',
    candidatesCount: 0,
    candidates: [],
    hasMoreCandidates: false,
    lastPosition: 0,
  },
  {
    id: 'rejected',
    name: 'Rejected',
    candidatesCount: 0,
    candidates: [],
    hasMoreCandidates: false,
    lastPosition: 0,
  },
]

const STATUS_POSITIONS: Record<Statuses, number> = {
  new: 0,
  interview: 1,
  hired: 2,
  rejected: 3,
}

export const useJobShowVM = (jobId?: string, httpClient: HttpClientPort = http) => {
  const [state, setState] = useState<JobShowState>(INITIAL_STATE)
  const [, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRY_ATTEMPTS = 3

  useEffect(() => {
    if (!state.user) {
      // Don't do anything if user is not connected
      return
    }

    if (!jobId) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Job ID is required',
      }))
      return
    }

    const fetch = async (jobId: string) => {
      setState(prevState => ({ ...prevState, isLoading: true, error: null }))

      const jobRepository = new JobRepository(httpClient)
      const candidateRepository = new CandidateRepository(httpClient)

      const [job, result] = await Promise.allSettled([
        jobRepository.getOne(jobId),
        candidateRepository.getAllForJobId(jobId),
      ])

      setState(prevState => ({ ...prevState, isLoading: false }))

      if (isRejected(job) || isRejected(result)) {
        setState(prevState => ({
          ...prevState,
          error: isRejected(job)
            ? `Job ${jobId} not found`
            : isRejected(result)
              ? `Candidates for job ${jobId} can't be retrieve`
              : 'Unexpected error',
        }))
        return
      }

      if (isFulfilled(job) && isFulfilled(result)) {
        setState(prevState => ({
          ...prevState,
          error: null,
          job: job.value,
          candidates: result.value.candidates,
          columns: result.value.columns,
        }))
      }
    }
    fetch(jobId).then()
  }, [jobId, httpClient, state.user])

  const handleUpdateFromSSE = (update: EventUpdate['data']) => {
    try {
      // Update the columns after each updates
      setState(prevState => ({
        ...prevState,
        columns: update.columns,
      }))

      // Do not update candidates if it's the same user
      if (update.user.name === state.user?.name) {
        return
      }

      // We only need to update if the updated candidate is on the visible area
      // of the current session
      const isUpdateNeeded = (newPosition: number, visibleCandidatesInStatus: Candidate[]) => {
        for (const candidate of visibleCandidatesInStatus) {
          if (candidate.position >= newPosition) return true
        }
        return visibleCandidatesInStatus.length <= 0
      }

      // check if position is contained in visible position
      if (
        !isUpdateNeeded(
          update.candidate.position,
          state.candidates.filter(c => c.status === update.candidate.status)
        )
      ) {
        return
      }

      if (update.kind === 'add') {
        setState(prevState => ({
          ...prevState,
          candidates: prevState.candidates.concat(update.candidate),
        }))
      } else if (update.kind === 'update') {
        // Depending on the state, we should update existing if already locally
        // Or added because it should be visible due to last cursor user has
        const alreadyOnMyList = state.candidates.find(c => c.id === update.candidate.id)
        setState(prevState => ({
          ...prevState,
          candidates: alreadyOnMyList
            ? prevState.candidates.map(candidate =>
                candidate.id === update.candidate.id
                  ? { ...candidate, ...update.candidate }
                  : candidate
              )
            : prevState.candidates.concat(update.candidate),
        }))
      }
    } catch (error) {
      console.error('Failed to process update:', error)
    }
  }
  // SSE Connection handling
  useEffect(() => {
    // Avoid to be able to test the VM
    if (process.env.NODE_ENV === 'test') {
      return
    }
    if (!state.user || !jobId) {
      // Don't do anything if jobId is null
      // or user is not connected
      return
    }

    let eventSource: EventSource | null = null

    const connectSSE = () => {
      eventSource = new EventSource(`/sse/jobs/${jobId}/updates`)

      eventSource.onopen = () => {
        setConnectionStatus('connected')
        setRetryCount(0)
      }

      eventSource.onerror = () => {
        setConnectionStatus('disconnected')
        eventSource?.close()

        // Implement exponential backoff for retries
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000)
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            connectSSE()
          }, timeout)
        } else {
          setState(prev => ({
            ...prev,
            error: 'Lost connection to server. Please refresh the page.',
          }))
        }
      }

      // Handle incoming SSE updates
      eventSource.addEventListener('candidate_updated', event => {
        handleUpdateFromSSE(JSON.parse(event.data))
      })
    }

    connectSSE()

    // Cleanup
    return () => {
      eventSource?.close()
      setConnectionStatus('disconnected')
    }
  }, [jobId, retryCount, state.user])

  const groupedCandidates = useMemo(() => {
    const columns = [...COLUMN_DEFINITIONS]
    columns.forEach(column => {
      column.candidates = []
      column.candidatesCount = column.candidates.length
      column.lastPosition = 0
    })

    // assign candidates to right column
    state.candidates.forEach(candidate => {
      const statusIndex = STATUS_POSITIONS[candidate.status] ?? -1
      if (statusIndex === -1) {
        throw new Error(`Status ${candidate.status} not handled right now`)
      }

      const column = columns[statusIndex]
      column.candidates.push(candidate)
    })

    // sort and count
    columns.forEach(column => {
      column.candidates.sort((a, b) => a.position - b.position)
      column.candidatesCount = state.columns[column.id] ?? 0
      column.lastPosition =
        column.candidates.length > 0 ? column.candidates[column.candidates.length - 1].position : 0
      column.hasMoreCandidates = column.candidatesCount > column.candidates.length
    })

    return columns
  }, [state.candidates, state.columns])

  const updateCandidateStatus = async (
    candidateId: number,
    newStatus: Statuses,
    newIndex: number
  ) => {
    // Early return if job not exist
    if (!state.job) {
      throw new Error('Job ID is required')
    }

    if (!state.user) {
      throw new Error('Should be logged')
    }

    const oldCandidate = state.candidates.find(
      (candidate: Candidate) => candidate.id === candidateId
    )
    if (!oldCandidate) {
      throw new Error(`Candidate ${candidateId} not found on the list`)
    }

    const { candidates: candidatesInTargetedColumn } =
      groupedCandidates[STATUS_POSITIONS[newStatus]]

    // Same state as before, do nothing
    if (
      candidatesInTargetedColumn[newIndex]?.id === oldCandidate.id &&
      oldCandidate.status === newStatus
    ) {
      return
    }

    const newPosition = calculateNewPosition(newIndex, candidatesInTargetedColumn)

    try {
      setState(prevState => ({
        ...prevState,
        error: null,
        candidates: prevState.candidates.map(candidate =>
          candidate.id === candidateId
            ? { ...candidate, status: newStatus, position: newPosition, updated_at: new Date() }
            : candidate
        ),
      }))

      const candidateRepository = new CandidateRepository(httpClient)
      await candidateRepository.updateCandidate(
        state.job.id,
        `${candidateId}`,
        newStatus,
        newPosition,
        oldCandidate.updated_at,
        state.user
      )
    } catch {
      setState(prevState => ({
        ...prevState,
        error: 'Error: status cannot be changed',
        candidates: prevState.candidates.map(candidate =>
          candidate.id === candidateId
            ? { ...candidate, status: oldCandidate.status, position: oldCandidate.position }
            : candidate
        ),
      }))
    }
  }

  const addCandidate = (newCandidate: Candidate) => {
    setState(prevState => ({
      ...prevState,
      candidates: prevState.candidates.concat(newCandidate),
    }))
  }

  const loadMoreItemsOnColumns = async (status: string, lastPosition: number) => {
    if (!state.job) {
      return
    }

    const candidateRepository = new CandidateRepository(httpClient)

    try {
      const result = await candidateRepository.getAllForJobId(state.job.id, status, lastPosition)

      setState(prevState => ({
        ...prevState,
        candidates: prevState.candidates.concat(...result.candidates),
      }))
    } catch {
      setState(prevState => ({
        ...prevState,
        error: "Error: can't fetch next item",
      }))
    }
  }

  const connectUser = (user: { name: string; color: string } | null) => {
    setState(prevState => ({
      ...prevState,
      user: user,
    }))
  }

  return {
    logged: !!state.user,
    user: state.user,
    userName: state.user?.name ?? '',
    userColor: state.user?.color ?? '#111111',
    isLoading: state.isLoading,
    hasError: !!state.error,
    error: state.error ?? '',
    jobName: state.job?.name ?? 'Not Found',
    groupedCandidates,
    updateCandidateStatus,
    loadMoreItemsOnColumns,
    connectUser,
    addCandidate,
  }
}
