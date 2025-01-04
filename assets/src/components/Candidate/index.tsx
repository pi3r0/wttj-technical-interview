import { Card } from '@welcome-ui/card'
import { Candidate } from '../../interfaces/Candidate'

function CandidateCard({ candidate,  handleDragStart }: { candidate: Candidate, handleDragStart: (candidate: Candidate) => void }) {

  return (
    <Card className="hover:shadow-md transition-shadow" onDragStart={() => handleDragStart(candidate)} draggable mb={10}>
      <Card.Body>{candidate.email}</Card.Body>
    </Card>
  )
}

export default CandidateCard
