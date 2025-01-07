import { useRef, type DragEvent } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Candidate } from '../../../interfaces/Candidate'
import CandidateCard from '../../Candidate'
import { Statuses } from '../../../interfaces/Candidate.ts'
import { Box } from '@welcome-ui/box'
import { Flex } from '@welcome-ui/flex'
import { Button } from '@welcome-ui/button'
import './style.scss'
import { Label } from '@welcome-ui/label'

interface CandidateListProps {
  candidates: Candidate[]
  columnId: Statuses
  columnLastPosition: number
  columnHasMoreRow: boolean
  draggedCandidateId?: number
  draggedOverRowId: number | null
  draggedOverColumnId: string | null
  handleDragOver: (e: DragEvent, columnId: string, rowId: number) => void
  handleDrop: (e: DragEvent, targetColumnStatus: Statuses, targetPosition: number) => void
  handleDragStart: (candidate: Candidate) => void
  handleDragEnd: (e: DragEvent) => void
  loadMoreItemsOnColumns: (status: string, lastPosition: number) => void
}

function CandidateList({
  candidates,
  columnId,
  columnLastPosition,
  columnHasMoreRow,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
  draggedOverColumnId,
  draggedOverRowId,
  draggedCandidateId,
  loadMoreItemsOnColumns,
}: CandidateListProps) {
  const parentRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: candidates.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    enabled: true,
  })

  const loadMoreArea = (
    <Box>
      <Button w="100%" onClick={() => loadMoreItemsOnColumns(columnId, columnLastPosition)}>
        Load More
      </Button>
    </Box>
  )

  const dragAndDropArea = (
    <Box
      className={`column-end-drop-area ${draggedOverColumnId === columnId && draggedOverRowId === candidates.length ? 'highlighted' : ''}`}
      onDrop={e => handleDrop(e, columnId, candidates.length)}
      onDragOver={e => handleDragOver(e, columnId, candidates.length)}
    >
      {draggedOverRowId === candidates.length && draggedOverColumnId === columnId ? (
        <Label>Drag Here</Label>
      ) : null}
    </Box>
  )

  const candidateCard = (index: number) => {
    return (
      <CandidateCard
        candidate={candidates[index]}
        cardIndex={index}
        isDraggedOver={
          draggedCandidateId !== candidates[index].id &&
          draggedOverRowId === index &&
          draggedOverColumnId === columnId
        }
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
      />
    )
  }

  return (
    <Flex p={10} ref={parentRef} style={{ overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {virtualRow.index > candidates.length - 1
              ? columnHasMoreRow
                ? loadMoreArea
                : dragAndDropArea
              : candidateCard(virtualRow.index)}
          </div>
        ))}
      </div>
    </Flex>
  )
}

export default CandidateList
