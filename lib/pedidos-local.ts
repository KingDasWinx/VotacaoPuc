// Guarda os códigos de pedido do usuário no localStorage (substitui a busca por CPF).
const KEY = 'simp_pedidos'

export function getPedidosLocais(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((c): c is string => typeof c === 'string') : []
  } catch {
    return []
  }
}

export function addPedidoLocal(codigo: string): void {
  if (typeof window === 'undefined' || !codigo) return
  const atual = getPedidosLocais()
  if (!atual.includes(codigo)) {
    localStorage.setItem(KEY, JSON.stringify([codigo, ...atual]))
  }
}

export function removePedidoLocal(codigo: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(getPedidosLocais().filter((c) => c !== codigo)))
}
