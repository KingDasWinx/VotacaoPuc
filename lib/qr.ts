import QRCode from 'qrcode'

/** Gera um Data URL PNG do QR Code a partir do payload PIX. */
export async function qrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { margin: 1, width: 320, errorCorrectionLevel: 'M' })
}
