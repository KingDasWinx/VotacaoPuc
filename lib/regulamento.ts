import { readFileSync } from 'fs'
import { join } from 'path'
import { REGULAMENTO_FILENAME } from '@/lib/regulamento-constants'

export { REGULAMENTO_FILENAME, REGULAMENTO_ACEITE_KEY } from '@/lib/regulamento-constants'

export function getRegulamentoMarkdown(): string {
  const path = join(process.cwd(), 'public', REGULAMENTO_FILENAME)
  return readFileSync(path, 'utf-8')
}
