import { HttpClientPort, http } from "../drivers/http";
import { baseURL } from './index';
import { Job } from "../interfaces/Job";

export interface JobRepositoryPort {
    getAll(): Promise<Job[]>;
    getOne(id: string): Promise<Job>;
}

export class JobRepository implements JobRepositoryPort {
    

    constructor(private readonly httpClient: HttpClientPort = http) {}

    getAll() {
        return this.httpClient.get<Job[]>(`${baseURL}/jobs`);
    }

    async getOne(jobId: string): Promise<Job> {
        return this.httpClient.get<Job>(`${baseURL}/jobs/${jobId}`);;
    }
}