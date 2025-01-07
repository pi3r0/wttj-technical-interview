import type { DragEvent } from 'react'
import { Card } from '@welcome-ui/card'
import { Candidate, Statuses } from '../../interfaces/Candidate'
import { Flex } from '@welcome-ui/flex'
import { Box } from '@welcome-ui/box'
import './style.scss'
import { Label } from '@welcome-ui/label'

function CandidateCard({
  candidate,
  cardIndex,
  isDraggedOver,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
}: {
  candidate: Candidate
  cardIndex: number
  isDraggedOver: boolean
  handleDragStart: (candidate: Candidate) => void
  handleDragEnd: (e: DragEvent) => void
  handleDragOver: (e: DragEvent, status: Statuses, index: number) => void
  handleDrop: (e: DragEvent, status: Statuses, index: number) => void
}) {
  return (
    <Flex gap={8} direction="column">
      {isDraggedOver ? (
        <Box
          className="card-drop-area"
          onDragOver={e => handleDragOver(e, candidate.status, cardIndex)}
          onDrop={e => handleDrop(e, candidate.status, cardIndex)}
        >
          <Label>Drag Here</Label>
        </Box>
      ) : null}

      <Card
        className="hover:shadow-md transition-shadow"
        onDragStart={() => handleDragStart(candidate)}
        onDragEnd={e => handleDragEnd(e)}
        onDragOver={e => handleDragOver(e, candidate.status, cardIndex)}
        draggable
        mb={10}
      >
        <Card.Body>{candidate.email}</Card.Body>
      </Card>
    </Flex>
  )
}

export default CandidateCard
