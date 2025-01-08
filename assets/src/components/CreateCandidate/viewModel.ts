import { useState, useEffect } from 'react'
import { HttpClientPort, http } from '../../drivers/http.ts'
import { Column } from '../../hooks/JobShowVM.ts'
import { isValidEmail, isValidStatus } from '../../utils/string.ts'
import { CandidateRepository } from '../../api/CandidateRepository.ts'

interface State {
  email: string | null
  emailError: string | null
  status: 'new' | 'interview' | 'rejected' | 'hired' | null
  statusError: string | null
  options: { value: string; label: string }[]
  isValid: boolean
  isLoading: boolean
  formError: string | null
}

const INITIAL_STATE: State = {
  email: null,
  emailError: null,
  status: 'new',
  statusError: null,
  options: [],
  isValid: false,
  isLoading: false,
  formError: null,
}

export function useCandidateCreateVM(
  isConnected: boolean,
  columns: Column[],
  user: { name: string; color: string } | null,
  jobId?: string,
  httpClient: HttpClientPort = http
) {
  const [state, setState] = useState<State>({ ...INITIAL_STATE })

  useEffect(() => {
    const build = () => {
      const options = columns.map(column => ({ value: column.id, label: column.name }))
      setState(() => ({
        ...INITIAL_STATE,
        options: options,
      }))
    }
    build()
  }, [columns])

  const emailHasChanged = (newValue: string) => {
    const isValid = isValidEmail(newValue ?? '')
    setState(prevState => ({
      ...prevState,
      email: newValue,
      emailError: isValid ? '' : 'Email must be valid',
      isValid,
    }))
  }
  const columnHasChanged = (newValue: string) => {
    if (!isValidStatus(newValue)) {
      // Should never appear but anticipate
      setState(prevState => ({
        ...prevState,
        status: null,
        statusError: 'Status is not a valid one',
      }))
      return
    }

    setState(prevState => ({
      ...prevState,
      status: newValue,
      statusError: '',
    }))
  }

  const submit = async () => {
    if (!state.isValid) {
      setState(prevState => ({
        ...prevState,
        formError: 'Check your inputs, something is wrong',
      }))
      return
    }

    if (!(user && jobId && state.email && state.status)) {
      // safety check, must be tested with valid state
      return
    }

    try {
      const candidateRepository = new CandidateRepository(httpClient)

      // Position will be calculated on the server directly
      const candidate = await candidateRepository.createCandidate(
        jobId,
        {
          email: state.email,
          status: state.status,
        },
        user
      )
      setState(prevState => ({
        ...prevState,
        formError: null,
      }))
      return candidate
    } catch (error) {
      if (error instanceof Error) {
        let errorMessage = 'Something went wrong'
        switch (error.message) {
          case '400': {
            errorMessage = 'Inputs are invalid'
            break
          }
          case '409': {
            errorMessage = 'Email address already exists'
            break
          }
          case '500': {
            errorMessage = 'Position already exists'
          }
        }
        setState(prevState => ({
          ...prevState,
          formError: errorMessage,
        }))
      }
    }
  }

  const resetState = () => {
    setState({ ...INITIAL_STATE })
  }

  return {
    options: state.options,
    isLoading: state.isLoading,
    formIsDisabled: !isConnected || !state.isValid,
    hasError: !!state.formError,
    emailError: state.emailError ?? '',
    status: state.status ?? '',
    statusError: state.statusError ?? '',
    formError: state.formError ?? '',
    emailHasChanged,
    columnHasChanged,
    submit,
    resetState,
  }
}
