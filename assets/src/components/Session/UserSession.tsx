import { useState } from 'react'
import { Modal, useModal } from '@welcome-ui/modal'
import { Flex } from '@welcome-ui/flex'
import { Field } from '@welcome-ui/field'
import { InputText } from '@welcome-ui/input-text'
import { Picker } from '@welcome-ui/picker'
import { Shape } from '@welcome-ui/shape'
import { WttjIcon } from '@welcome-ui/icons'
import { Text } from '@welcome-ui/text'
import { Button } from '@welcome-ui/button'

interface Props {
  isConnected: boolean
  handleConnection: (props: { name: string; color: string } | null) => void
}

function UserSession({ isConnected, handleConnection }: Props) {
  const modal = useModal()
  const [userFieldError, setUserFieldError] = useState('')
  const [name, setName] = useState(null)
  const [avatarColor, setAvatarColor] = useState('#ffb3ba')
  const [formIsValid, setFormIsValid] = useState(false)

  const options = ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'].map(option => ({
    element: ({ selected }: { selected: boolean }) => (
      <Shape backgroundColor={selected ? 'yellow-80' : 'unset'} shape="circle" w={40}>
        <WttjIcon color={option} />
      </Shape>
    ),
    value: option,
  }))

  // from the kit itself, issue with type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const handleUserNameChange = event => {
    const newValue = event.target.value === '' ? null : event.target.value
    setName(newValue)
    setUserFieldError(!newValue ? 'Choose one, you may' : '')
    setFormIsValid(!!newValue)
  }

  // from the kit itself, issue with type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const handleAvatarChange = event => {
    setAvatarColor(event.target.value)
    setFormIsValid(!!name)
  }

  const submit = () => {
    if (!name) {
      // Not supposed to happened with change control behaviour
      // need to be unit tested later
      setUserFieldError('Choose one, you may')
      return
    }
    handleConnection({ name, color: avatarColor })
  }

  const handleLogOut = () => {
    handleConnection(null)
  }

  return (
    <Flex>
      {isConnected ? (
        <Flex align="center" direction="row" gap={8}>
          <Shape backgroundColor={avatarColor} shape="circle" w={24}>
            <WttjIcon size="sm" />
          </Shape>
          <Text variant="h5" color="white" m={0}>
            {name}
          </Text>
          <Button danger onClick={handleLogOut} size="xs">
            log out
          </Button>
        </Flex>
      ) : null}
      <Modal ariaLabel="Login Modal" store={modal} open={!isConnected}>
        <Modal.Content store={modal} withClosingButton={false}>
          <Modal.Body>
            <Flex direction="column" gap={32}>
              <Text mb={0} variant="h3">
                Connect yourself
              </Text>
              <Flex direction="column" gap={16}>
                <Field label="Pick an username" error={userFieldError} required>
                  <InputText placeholder="funnyDude" onChange={handleUserNameChange} />
                </Field>
                <Field label="Pick an avatar" required>
                  <Picker
                    name="avatarColor"
                    onChange={handleAvatarChange}
                    options={options}
                    value={avatarColor}
                  />
                </Field>
              </Flex>
            </Flex>
          </Modal.Body>
          <Modal.Footer>
            <Button disabled={!formIsValid} onClick={submit}>
              Let's go
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Flex>
  )
}

export default UserSession
