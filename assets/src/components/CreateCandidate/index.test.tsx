import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../../test-utils'
import CandidateCreation from './index'
import { aCandidate } from '../../test/builders/aCandidate.ts'
import * as viewModel from './viewModel'

// Mock the viewModel
vi.mock('./viewModel', () => ({
  useCandidateCreateVM: vi.fn(),
}))

describe('CandidateCreation', () => {
  const mockProps = {
    jobId: '123',
    user: { name: 'John Doe', color: '#000000' },
    isConnected: true,
    columns: [
      {
        id: 'new',
        name: 'New',
        candidatesCount: 0,
        candidates: [],
        hasMoreCandidates: false,
        lastPosition: 1000,
      },
      {
        id: 'interview',
        name: 'Interview',
        candidatesCount: 0,
        candidates: [],
        hasMoreCandidates: false,
        lastPosition: 1000,
      },
    ],
    candidateHasBeenCreated: vi.fn(),
  }

  const mockViewModelReturn = {
    options: [
      { value: 'new', label: 'New' },
      { value: 'interview', label: 'Interview' },
    ],
    isLoading: false,
    formIsDisabled: false,
    hasError: false,
    emailError: '',
    status: 'new',
    statusError: '',
    formError: '',
    emailHasChanged: vi.fn(),
    columnHasChanged: vi.fn(),
    submit: vi.fn(),
    resetState: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(viewModel.useCandidateCreateVM).mockReturnValue(mockViewModelReturn)
  })

  it('renders the create user button', () => {
    const { getByText } = render(<CandidateCreation {...mockProps} />)
    expect(getByText('Create User')).toBeInTheDocument()
  })

  it('opens the modal when create user button is clicked', async () => {
    const { getByText, user } = render(<CandidateCreation {...mockProps} />)
    await user.click(getByText('Create User'))
    expect(getByText('Add Candidate')).toBeInTheDocument()
  })

  it('submits the form', async () => {
    const newCandidate = aCandidate().build()
    mockViewModelReturn.submit.mockResolvedValue(newCandidate)

    const { getByText, user } = render(<CandidateCreation {...mockProps} />)
    await user.click(getByText('Create User'))
    await user.click(getByText("Let's go"))

    expect(mockViewModelReturn.submit).toHaveBeenCalled()
    expect(mockProps.candidateHasBeenCreated).toHaveBeenCalledWith(newCandidate)
  })

  it('displays error message when form submission fails', async () => {
    mockViewModelReturn.submit.mockResolvedValue(null)
    mockViewModelReturn.hasError = true
    mockViewModelReturn.formError = 'Submission failed'

    const { getByText, user } = render(<CandidateCreation {...mockProps} />)
    await user.click(getByText('Create User'))
    await user.click(getByText("Let's go"))

    expect(getByText('Submission failed')).toBeInTheDocument()
  })
})
