import { expect, test } from 'vitest'

import { Candidate } from '../../interfaces/Candidate'
import { render } from '../../test-utils'
import CandidateCard from '../../components/Candidate'

test('renders candidate email', () => {
  const candidate: Candidate = {
    id: 10,
    email: 'test@example.com',
    position: 1,
    status: 'new',
    updated_at: new Date(),
  }
  const { getByText } = render(
    <CandidateCard
      candidate={candidate}
      cardIndex={0}
      isDraggedOver={false}
      handleDrop={() => {}}
      handleDragOver={() => {}}
      handleDragStart={() => {}}
      handleDragEnd={() => {}}
    />
  )
  expect(getByText('test@example.com')).toBeInTheDocument()
})
