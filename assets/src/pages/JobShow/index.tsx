import { useParams } from 'react-router-dom'
import { useState, type DragEvent } from 'react'
import { useJobShowVM } from '../../hooks/JobShowVM'
import { Text } from '@welcome-ui/text'
import { Flex } from '@welcome-ui/flex'
import { Box } from '@welcome-ui/box'
import { Candidate, Statuses } from '../../interfaces/Candidate'
import StatusColumnHeader from '../../components/JobShow/StatusColumnHeader/StatusColumnHeader.tsx'
import './style.scss'
import ColorPickerModal from '../../components/ColorPickerModal.tsx'
import CandidateList from '../../components/JobShow/CandidateList'

function JobShow() {
  const { jobId } = useParams()

  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null)
  const [draggedOverColumnId, setDraggedOverColumnId] = useState<string | null>(null)
  const [draggedOverRowId, setDraggedOverRowId] = useState<number | null>(null)

  const {
    logged,
    setUser,
    jobName,
    isLoading,
    hasError,
    error,
    groupedCandidates,
    updateCandidateStatus,
    loadMoreItemsOnColumns,
  } = useJobShowVM(jobId)

  const handleSubmit = (data: { name: string; color: string }) => {
    setUser(data)
  }

  const handleDragStart = (candidate: Candidate) => {
    setDraggedCandidate(candidate)
  }

  const handleDragOver = (e: DragEvent, columnId: string, rowId: number): void => {
    e.preventDefault()
    setDraggedOverColumnId(columnId)
    setDraggedOverRowId(rowId)
  }

  const handleDragEnd = (e: DragEvent): void => {
    e.preventDefault()
    setDraggedCandidate(null)
    setDraggedOverColumnId(null)
    setDraggedOverRowId(null)
  }

  const handleDrop = async (e: DragEvent, targetColumnStatus: Statuses, targetPosition: number) => {
    e.preventDefault()
    if (!draggedCandidate) {
      return
    }

    await updateCandidateStatus(draggedCandidate.id, targetColumnStatus, targetPosition)
    setDraggedCandidate(null)
    setDraggedOverColumnId(null)
    setDraggedOverRowId(null)
  }

  return (
    <>
      <ColorPickerModal isOpen={!logged} onSubmit={handleSubmit} />
      <Box backgroundColor="neutral-70" p={20} alignItems="center">
        <Text variant="h5" color="white" m={0}>
          {jobName}
        </Text>
      </Box>
      <Box p={20}>
        {isLoading ? <div>Loading...</div> : null}

        {hasError ? (
          <div className="error">
            <span> Error: {error}</span>
          </div>
        ) : null}
        <Flex gap={10}>
          {groupedCandidates.map(column => (
            <Box
              w={300}
              border={1}
              backgroundColor="white"
              borderColor={draggedOverColumnId === column.id ? 'bg-blue-50' : 'neutral-30'}
              borderRadius="md"
              overflow="hidden"
              key={column.id}
            >
              <StatusColumnHeader name={column.name} candidateCount={column.candidatesCount} />
              <Flex
                w="100%"
                h="300px"
                direction="column"
                backgroundColor="white"
                className="column"
              >
                <CandidateList
                  candidates={column.candidates}
                  columnId={column.id}
                  columnLastPosition={column.lastPosition}
                  columnHasMoreRow={column.hasMoreCandidates}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  draggedCandidateId={draggedCandidate?.id}
                  draggedOverRowId={draggedOverRowId}
                  draggedOverColumnId={draggedOverColumnId}
                  loadMoreItemsOnColumns={loadMoreItemsOnColumns}
                />
              </Flex>
            </Box>
          ))}
        </Flex>
      </Box>
    </>
  )
}

export default JobShow
