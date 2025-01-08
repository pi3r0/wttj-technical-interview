import { useState, useEffect } from 'react'
import { HttpClientPort, http } from '../../drivers/http.ts'
import { Column } from '../../hooks/JobShowVM.ts'
import { isValidEmail, isValidStatus } from '../../utils/string.ts'
import { toast, Toast } from '@welcome-ui/toast'

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

export function useCandidateCreateVM(columns: Column[], httpClient: HttpClientPort = http) {
  const [state, setState] = useState<State>(INITIAL_STATE)

  useEffect(() => {
    const build = () => {
      const options = columns.map(column => ({ value: column.id, label: column.name }))
      setState(prevState => ({
        ...prevState,
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
    }))
  }
  const columnHasChanged = (newValue: string) => {
    if (!isValidStatus(newValue)) {
      // Should never appear but anticipate
      setState(prevState => ({
        ...prevState,
        status: null,
        statusError: 'Status is not a valid one',
        isValid: false,
      }))
      return
    }

    setState(prevState => ({
      ...prevState,
      status: newValue,
      isValid: true,
    }))
  }

  const submit = () => {
    if (!state.isValid) {
      setState(prevState => ({
        ...prevState,
        formError: 'Check your input, something is wrong',
      }))
      return
    }

      try {
          toast(
              <Toast.Growl variant="success">
                  <Toast.Title>Success</Toast.Title>
          The candidate {state.email} has been successfully added to the {state.email} column
          </Toast.Growl>)
      }
  }

  return {
    options: state.options,
    isLoading: state.isLoading,
    formIsDisabled: state.isValid,
    hasError: !!state.formError,
    emailError: state.emailError,
    statusError: state.statusError,
    formError: state.formError,
    emailHasChanged,
    columnHasChanged,
    submit,
  }
}
