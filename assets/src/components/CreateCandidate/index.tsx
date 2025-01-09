import { Modal, useModal } from '@welcome-ui/modal'
import { Flex } from '@welcome-ui/flex'
import { Field } from '@welcome-ui/field'
import { InputText } from '@welcome-ui/input-text'
import { Select, SelectProps } from '@welcome-ui/select'
import { Button } from '@welcome-ui/button'
import { Loader } from '@welcome-ui/loader'
import { Column } from '../../hooks/JobShowVM.ts'

import { useCandidateCreateVM } from './viewModel.ts'
import { Text } from '@welcome-ui/text'
import { isString } from '../../utils/string.ts'
import { Candidate } from '../../interfaces/Candidate.ts'

interface Props {
  jobId?: string
  user: { name: string; color: string } | null
  isConnected: boolean
  columns: Column[]
  candidateHasBeenCreated: (newCandidate: Candidate) => void
}

function CandidateCreation({ jobId, user, isConnected, columns, candidateHasBeenCreated }: Props) {
  const {
    options,
    isLoading,
    formIsDisabled,
    hasError,
    emailError,
    status,
    statusError,
    formError,
    emailHasChanged,
    columnHasChanged,
    submit,
    resetState,
  } = useCandidateCreateVM(isConnected, columns, user, jobId)

  const modal = useModal({ onClose: () => resetState() })
  // from the kit itself, issue with type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const handleEmailChanges = event => {
    const newValue = event.target.value === '' ? '' : event.target.value
    emailHasChanged(newValue)
  }

  const handleColumnChange = (newValue: SelectProps['value']) => {
    const stringNewValue = isString(newValue) ? newValue : ''
    columnHasChanged(stringNewValue)
  }

  const handleSubmit = async () => {
    const newCandidate = await submit()
    if (!newCandidate) {
      return
    }
    modal.hide()
    candidateHasBeenCreated(newCandidate)
  }

  return (
    <>
      <Modal.Trigger disabled={!isConnected} as={Button} store={modal}>
        Create User
      </Modal.Trigger>
      <Modal ariaLabel="Create User modal" store={modal}>
        <Modal.Content store={modal}>
          <Modal.Header title="Add Candidate" />
          <Modal.Body pb={128}>
            <Flex direction="column" gap={32}>
              <Flex direction="column" gap={16}>
                <Field label="Candidate Email" error={emailError} required>
                  <InputText
                    placeholder="michael_scott@dunder-mifflin.com"
                    onChange={handleEmailChanges}
                  />
                </Field>
                <Field label="Candidate Status" error={statusError} required>
                  <Select
                    name="status"
                    onChange={handleColumnChange}
                    value={status}
                    options={options}
                  />
                </Field>
                {hasError ? (
                  <Flex
                    direction="column"
                    p={8}
                    backgroundColor="red-50"
                    color="neutral-10"
                    borderRadius={9}
                  >
                    <Text variant="h4" m={4} color="neutral-10">
                      Error
                    </Text>
                    <Text m={4}>{formError}</Text>
                  </Flex>
                ) : null}
              </Flex>
            </Flex>
          </Modal.Body>
          <Modal.Footer>
            {isLoading ? (
              <Loader />
            ) : (
              <Button disabled={formIsDisabled} onClick={handleSubmit}>
                Let's go
              </Button>
            )}
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default CandidateCreation
