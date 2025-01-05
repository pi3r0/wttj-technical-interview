import { useState, useEffect, useMemo } from 'react'
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

const statusesToPosition: Record<Statuses, number> = {
  new: 0,
  interview: 1,
  hired: 2,
  rejected: 3,
}

interface JobShowUIModel {
  isLoading: boolean
  hasError: boolean
  error: string
  jobName: string
}

const initialState: JobShowUIModel = {
  isLoading: true,
  hasError: false,
  error: '',
  jobName: 'Not a Job',
}

export const useJobShowVM = (jobId?: string, httpClient: HttpClientPort = http) => {
  const [uiModel, setUIModel] = useState<JobShowUIModel>(initialState)
  const [candidates, setCandidates] = useState<Candidate[]>([])

  useEffect(() => {
    const fetch = async (jobId?: string) => {
      setUIModel({ ...initialState })

      if (!jobId) {
        setUIModel(prev => ({ ...prev, isLoading: false, hasError: true, error: 'Job ID missing' }))
        return
      }

      const jobRepository = new JobRepository(httpClient)
      const candidateRepository = new CandidateRepository(httpClient)

      const [job, candidates] = await Promise.allSettled([
        jobRepository.getOne(jobId),
        candidateRepository.getAllForJobId(jobId),
      ])

      setUIModel(prevUIModel => ({ ...prevUIModel, isLoading: false }))
      if (isRejected(job) || isRejected(candidates)) {
        console.log(job)
        console.log(candidates)
        setUIModel(prevUIModel => ({
          ...prevUIModel,
          hasError: true,
          error: isRejected(job)
            ? `Job ${jobId} not found`
            : isRejected(candidates)
              ? `Candidates for job ${jobId} can't be retreive`
              : '',
        }))
        return
      }

      if (isFulfilled(job) && isFulfilled(candidates)) {
        setUIModel(prevUIModel => ({
          ...prevUIModel,
          hasError: false,
          error: '',
          jobName: job.value.name,
        }))
        setCandidates(candidates.value)
      }
    }
    fetch(jobId).then()
  }, [jobId])

  const groupedCandidates = useMemo(() => {
    return candidates.reduce<Column[]>(
      (acc, curr) => {
        const statusIndex = statusesToPosition[curr.status] ?? 4
        if (!acc[statusIndex]) {
          acc[statusIndex] = {
            id: curr.status,
            name: curr.status,
            candidatesCount: 0,
            candidates: [],
          }
        }

        acc[statusIndex].candidates = [...acc[statusIndex].candidates, curr].sort(
          (a, b) => a.position - b.position
        )
        acc[statusIndex].candidatesCount = acc[statusIndex].candidates.length

        return acc
      },
      [
        {
          id: 'new',
          name: 'new',
          candidatesCount: 0,
          candidates: [],
        },
        {
          id: 'interview',
          name: 'interview',
          candidatesCount: 0,
          candidates: [],
        },
        {
          id: 'hired',
          name: 'hired',
          candidatesCount: 0,
          candidates: [],
        },
        {
          id: 'rejected',
          name: 'rejected',
          candidatesCount: 0,
          candidates: [],
        },
      ]
    )
  }, [candidates])

  const updateCandidateStatus = async (candidateId: number, newStatus: Statuses) => {
    // Early return if job not exist
    if (!jobId) {
      return
    }

    const oldCandidate = candidates.find((candidate: Candidate) => candidate.id === candidateId)
    if (!oldCandidate) {
      return
    }

    try {
      if (oldCandidate.status === newStatus) {
        console.log('SAME')
        return
      }
      setUIModel({ ...uiModel, hasError: false, error: '' })
      setCandidates(prevCandidates =>
        prevCandidates.map(candidate =>
          candidate.id === candidateId ? { ...candidate, status: newStatus } : candidate
        )
      )

      const candidateRepository = new CandidateRepository(httpClient)
      await candidateRepository.updateStatus(jobId, `${candidateId}`, newStatus)
    } catch (error) {
      console.error(error)
      setCandidates(prevCandidates =>
        prevCandidates.map(candidate =>
          candidate.id === candidateId ? { ...candidate, status: oldCandidate.status } : candidate
        )
      )
      setUIModel({ ...uiModel, hasError: true, error: 'Error: status cannot be changed' })
    }
  }

  return { ...uiModel, groupedCandidates, updateCandidateStatus }
}
