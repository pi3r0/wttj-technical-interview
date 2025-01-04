import { useState, useRef } from "react";
import { CandidateRepository } from "../api/CandidateRepository";
import { JobRepository } from "../api/JobRepository";
import { Candidate, Statuses } from "../interfaces/Candidate";
import { Job } from "../interfaces/Job";

interface Column {
    id: Statuses;
    name: string;
    candidatesCount: number;
    candidates: Candidate[];
}

interface JobShowUIModel {
    isLoading: boolean;
    hasError: boolean;
    error: string;
    jobName: string;
    columns: Column[];
}


const initialColumns: Column[] = [
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
        }
    ];

const initialState: JobShowUIModel = {
    isLoading: true,
    hasError: false,
    error: '',
    jobName: 'Not a Job',
    columns: [...initialColumns],
}

export const useJobShowVM = () => {
    const jobRepository = new JobRepository();
    const candidateRepository = new CandidateRepository();

    const job = useRef<Job | null>(null);
    const candidates = useRef<Candidate[]>([]);
    const [uiModel, setUIModel] = useState<JobShowUIModel>(initialState);

    const load = async (jobId?: string) => {
        setUIModel({ ...initialState });
        job.current = { id: '-1', name: 'Not A Job' };
        candidates.current = [];

        if (!jobId) {
            setUIModel({ ...initialState, isLoading: false, hasError: true, error: 'Job ID missing'})
            return
        }

        try {
            job.current = await jobRepository.getOne(jobId);
        } catch {
            setUIModel({ ...initialState, isLoading: false, hasError: true, error: `Job ${jobId} not Found`});
            return;
        }

        try {
            candidates.current = await candidateRepository.getAllForJobId(jobId);
        } catch {
            setUIModel({ ...initialState, isLoading: false, hasError: true, error: `Candidates for Job ${jobId} cant be retreive`})
            return;
        }

        updateUIModel()
    }

    const updateCandidateStatus = async (candidateId: number, newStatus: Statuses) => {
        // Early return if job not exist
        if (!job.current) { return; }

        const candidate = candidates.current.find((candidate: Candidate) => candidate.id === candidateId);
        if (!candidate) { return; }

        if (candidate.status === newStatus) {
            console.log('SAME');
            return;
        }

        try {
            await candidateRepository.updateStatus(job.current.id, `${candidate.id}`, newStatus);
            candidate.status = newStatus;
            updateUIModel();
        } catch (error){
            console.error(error)
            setUIModel({ ...uiModel, hasError: true, error: 'Error: status cannot be changed' });
        }

    }

    const updateUIModel = () => {
        const statusesToPosition: Record<Statuses, number> = {
            'new': 0,
            'interview': 1,
            'hired': 2,
            'rejected': 3,
        }

         const sortedCandidates = candidates.current.reduce<Column[]>((acc, curr) => {
            const statusIndex = statusesToPosition[curr.status] ?? 4;
            if (!acc[statusIndex]) {
                acc[statusIndex] = { id: curr.status, name: curr.status, candidatesCount: 0, candidates: []}
            }

            acc[statusIndex].candidates = [...acc[statusIndex].candidates, curr].sort((a, b) => a.position - b.position);
            acc[statusIndex].candidatesCount = acc[statusIndex].candidates.length;

            return acc;
        }, [
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
             }
         ]);

        setUIModel({
            isLoading: false,
            hasError: false,
            error: '',
            jobName: job.current?.name ?? 'Not loaded',
            columns: sortedCandidates,
        })
    }

    return { load, updateCandidateStatus, uiModel };
}