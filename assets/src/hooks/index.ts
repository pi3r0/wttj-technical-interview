import { useQuery } from 'react-query'
import { getJobs } from '../api'
import { JobRepository } from '../api/JobRepository'
import { CandidateRepository } from '../api/CandidateRepository'

export const useJobs = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })

  return { isLoading, error, jobs: data }
}

export const useJob = (jobId?: string) => {
  const jobRepository = new JobRepository();

  const { isLoading, error, data } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobRepository.getOne(jobId ?? '1'),
    enabled: !!jobId,
  })

  return { isLoading, error, job: data }
}

export const useCandidates = (jobId?: string) => {
  const candidateRepository = new CandidateRepository();

  const { isLoading, error, data } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () => candidateRepository.getAllForJobId(jobId ?? '1'),
    enabled: !!jobId,
  })

  return { isLoading, error, candidates: data }
}
