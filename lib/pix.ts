import { formatPixAmount } from '@/lib/money'

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF). Retorna 4 hex maiúsculos. */
export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Monta um campo EMV: ID(2) + LEN(2) + VALUE. */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

/** Remove acentos e mantém só caracteres ASCII imprimíveis seguros para o BR Code. */
function sanitizeText(text: string, maxLen: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .slice(0, maxLen)
    .trim()
}

/** Monta o "PIX Copia e Cola" (BR Code estático com valor). */
export function buildPixPayload(p: {
  chave: string
  nome: string
  cidade: string
  valorCentavos: number
  txid: string
}): string {
  const merchantAccount = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', p.chave)

  const txid = p.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
  const additionalData = tlv('05', txid)

  let payload =
    tlv('00', '01') + // payload format indicator
    tlv('26', merchantAccount) + // merchant account info (Pix)
    tlv('52', '0000') + // merchant category code
    tlv('53', '986') + // currency BRL
    tlv('54', formatPixAmount(p.valorCentavos)) + // amount
    tlv('58', 'BR') + // country
    tlv('59', sanitizeText(p.nome, 25)) + // merchant name
    tlv('60', sanitizeText(p.cidade, 15)) + // merchant city
    tlv('62', additionalData) // additional data (txid)

  payload += '6304' // campo CRC: ID(63) + LEN(04)
  return payload + crc16(payload)
}
