import { useParams } from 'react-router-dom'
import {useEffect, useState, type DragEvent } from 'react';
import { useJobShowVM } from '../../hooks/JobShowVM'
import { Text } from '@welcome-ui/text'
import { Flex } from '@welcome-ui/flex'
import { Box } from '@welcome-ui/box'
import { Candidate, Statuses } from '../../interfaces/Candidate'
import CandidateCard from '../../components/Candidate'
import { Badge } from '@welcome-ui/badge'
import './style.scss'

function JobShow() {
  const { jobId } = useParams()
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);

  const viewModel = useJobShowVM();

  useEffect(() => {
    viewModel.load(jobId);
  }, [jobId]);

  const handleDragStart = (candidate: Candidate) => {
      setDraggedCandidate(candidate);
  };

  const handleDragOver = (e: DragEvent): void => {
      e.preventDefault();
  };

  const handleDrop = (e: DragEvent, targetColumnStatus: Statuses) => {
    e.preventDefault();
    if (!draggedCandidate) {
        return;
    }
    
    viewModel.updateCandidateStatus(draggedCandidate.id, targetColumnStatus);
  };

  return (
    <>
      <Box backgroundColor="neutral-70" p={20} alignItems="center">
        <Text variant="h5" color="white" m={0}>
          {viewModel.uiModel.jobName}
        </Text>
      </Box>
      <Box p={20}>
          { viewModel.uiModel.isLoading ? (<div>Loading...</div>) : null }

          { viewModel.uiModel.hasError ? (<div className="error" ><span> Error: { viewModel.uiModel.error }</span></div>) : null }
        <Flex gap={10}>
          {viewModel.uiModel.columns.map(column => (
            <Box
              w={300}
              border={1}
              backgroundColor="white"
              borderColor="neutral-30"
              borderRadius="md"
              overflow="hidden"
              key={column.id}
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <Flex
                p={10}
                borderBottom={1}
                borderColor="neutral-30"
                alignItems="center"
                justify="space-between"
              >
                <Text color="black" m={0} textTransform="capitalize">
                  {column.name}
                </Text>
                <Badge>{column.candidatesCount}</Badge>
              </Flex>
              <Flex
                  direction="column"
                  p={10}
                  pb={0}>
                {column.candidates.map((candidate: Candidate) => (
                  <CandidateCard
                      candidate={candidate} key={candidate.id}
                      handleDragStart={handleDragStart}
                  />
                ))}
              </Flex>
            </Box>
          ))}
        </Flex>
      </Box>
    </>
  )
}

export default JobShow
