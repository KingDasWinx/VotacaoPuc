import { randomInt } from 'crypto'

/** Alfabeto sem caracteres ambíguos (sem 0/O/1/I). */
export const CODIGO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Gera um código de pedido não-enumerável: "SIM-XXXX". */
export function generateCodigo(): string {
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += CODIGO_ALPHABET[randomInt(CODIGO_ALPHABET.length)]
  }
  return `SIM-${suffix}`
}
