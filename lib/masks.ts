/**
 * Máscaras progressivas para inputs (formatam enquanto o usuário digita).
 * São tolerantes a entrada parcial — sempre retornam o melhor formato possível.
 */

/** Máscara de CPF: "52998224725" -> "529.982.247-25" (parcial: "5299" -> "529.9"). */
export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`
  return d
}

/**
 * Máscara do telefone BR **nacional** (DDD + número), sem o DDI.
 * Ex.: "45991348030" -> "45 9 9134-8030"; fixo (10) -> "45 3333-4040".
 * O "+55" deve ser exibido como prefixo fixo no input (não entra no valor, para
 * não ser reinterpretado como DDD a cada tecla). Aceita colar número com 55 na frente.
 */
export function maskTelefone(value: string): string {
  let d = value.replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2) // colado com DDI
  d = d.slice(0, 11)
  if (!d) return ''

  const ddd = d.slice(0, 2)
  if (d.length <= 2) return ddd

  const rest = d.slice(2)
  if (d.length <= 6) return `${ddd} ${rest}`
  if (d.length <= 10) {
    return `${ddd} ${rest.slice(0, 4)}${rest.length > 4 ? '-' + rest.slice(4) : ''}`
  }
  // 11 dígitos: celular com 9 na frente -> "9 9134-8030"
  return `${ddd} ${rest.slice(0, 1)} ${rest.slice(1, 5)}-${rest.slice(5)}`
}
