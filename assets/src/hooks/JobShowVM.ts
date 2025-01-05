import { useState, useEffect, useMemo, useCallback } from 'react'
import { isRejected, isFulfilled } from '../utils/promise.ts'
import { CandidateRepository } from '../api/CandidateRepository'
import { JobRepository } from '../api/JobRepository'
import { Candidate, Statuses } from '../interfaces/Candidate'
import { http, HttpClientPort } from '../drivers/http.ts'

interface Column {
  id: Statuses
  name: string
  candidatesCount: number
  candidates: Candidate[]
}

interface JobShowState {
  isLoading: boolean
  error: string | null
  job: {
    id: string
    name: string
  } | null
  candidates: Candidate[]
}

const INITIAL_STATE: JobShowState = {
  isLoading: true,
  error: null,
  job: null,
  candidates: [],
}

const COLUMN_DEFINITIONS: Column[] = [
  { id: 'new', name: 'New', candidatesCount: 0, candidates: [] },
  { id: 'interview', name: 'Interview', candidatesCount: 0, candidates: [] },
  { id: 'hired', name: 'Hired', candidatesCount: 0, candidates: [] },
  { id: 'rejected', name: 'Rejected', candidatesCount: 0, candidates: [] },
]

const STATUS_POSITIONS: Record<Statuses, number> = {
  new: 0,
  interview: 1,
  hired: 2,
  rejected: 3,
}

export const useJobShowVM = (jobId?: string, httpClient: HttpClientPort = http) => {
  const [state, setState] = useState<JobShowState>(INITIAL_STATE)

  useEffect(() => {
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

      const [job, candidates] = await Promise.allSettled([
        jobRepository.getOne(jobId),
        candidateRepository.getAllForJobId(jobId),
      ])

      setState(prevState => ({ ...prevState, isLoading: false }))
      if (isRejected(job) || isRejected(candidates)) {
        setState(prevState => ({
          ...prevState,
          error: isRejected(job)
            ? `Job ${jobId} not found`
            : isRejected(candidates)
              ? `Candidates for job ${jobId} can't be retrieve`
              : 'Unexpected error',
        }))
        return
      }

      if (isFulfilled(job) && isFulfilled(candidates)) {
        setState(prevState => ({
          ...prevState,
          error: null,
          job: job.value,
          candidates: candidates.value,
        }))
      }
    }
    fetch(jobId).then()
  }, [jobId, httpClient])

  const groupedCandidates = useMemo(() => {
    const columns = [...COLUMN_DEFINITIONS]
    columns.forEach(column => {
      column.candidates = []
      column.candidatesCount = column.candidates.length
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
      column.candidatesCount = column.candidates.length
    })

    return columns
  }, [state.candidates])

  const calculateNewPosition = useCallback(
    (targetIndex: number, candidatesInColumn: Candidate[]): number => {
      if (candidatesInColumn.length === 0) return 1000

      const prevPosition =
        targetIndex > 0 ? (candidatesInColumn[targetIndex - 1]?.position ?? 0) : 0

      const nextPosition = candidatesInColumn[targetIndex]?.position

      if (!nextPosition) return prevPosition + 1000
      return prevPosition + (nextPosition - prevPosition) / 2
    },
    []
  )

  const updateCandidateStatus = async (
    candidateId: number,
    newStatus: Statuses,
    newIndex: number
  ) => {
    // Early return if job not exist
    if (!state.job) {
      throw new Error('Job ID is required')
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
            ? { ...candidate, status: newStatus, position: newPosition }
            : candidate
        ),
      }))

      const candidateRepository = new CandidateRepository(httpClient)
      await candidateRepository.updateCandidate(
        state.job.id,
        `${candidateId}`,
        newStatus,
        newPosition
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

  return {
    isLoading: state.isLoading,
    hasError: !!state.error,
    error: state.error ?? '',
    jobName: state.job?.name ?? 'Not Found',
    groupedCandidates,
    updateCandidateStatus,
  }
}
