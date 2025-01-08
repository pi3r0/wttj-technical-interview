import type { Job } from '../../interfaces/Job'

class JobBuilder {
  job: Job

  constructor(job?: Partial<Job>) {
    this.job = {
      id: '1',
      name: 'Engineer Manager Hands on',
      ...job,
    }
  }

  build() {
    return this.job
  }
}

export const aJob = (job?: Partial<Job>) => new JobBuilder(job)
