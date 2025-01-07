import { Text } from '@welcome-ui/text'
import { Badge } from '@welcome-ui/badge'
import { Flex } from '@welcome-ui/flex'

function StatusColumnHeader({ name, candidateCount }: { name: string; candidateCount: number }) {
  return (
    <Flex
      p={10}
      borderBottom={1}
      borderColor="neutral-30"
      alignItems="center"
      justify="space-between"
    >
      <Text color="black" m={0} textTransform="capitalize">
        {name}
      </Text>
      <Badge>{candidateCount}</Badge>
    </Flex>
  )
}

export default StatusColumnHeader
