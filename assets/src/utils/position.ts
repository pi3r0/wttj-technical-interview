import { Candidate } from '../interfaces/Candidate.ts'

export const calculateNewPosition = (
  targetIndex: number,
  candidatesInColumn: Candidate[]
): number => {
  if (candidatesInColumn.length === 0) return 1000

  const prevPosition = targetIndex > 0 ? (candidatesInColumn[targetIndex - 1]?.position ?? 0) : 0

  const nextPosition = candidatesInColumn[targetIndex]?.position

  if (!nextPosition) return prevPosition + 1000
  return prevPosition + (nextPosition - prevPosition) / 2
}
