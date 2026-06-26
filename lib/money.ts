/** Formata centavos como moeda brasileira: 15000 -> "R$ 150,00". */
export function formatBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
    .format(centavos / 100)
    .replace(/\s/g, ' ')
}

/** Formata centavos para o campo de valor do BR Code PIX: 15000 -> "150.00". */
export function formatPixAmount(centavos: number): string {
  return (centavos / 100).toFixed(2)
}
