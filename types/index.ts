export interface Candidato {
  id: string
  nome: string
  frase: string
  foto_url: string
  created_at: string
}

export interface Voto {
  id: string
  candidato_id: string
  nome_votante: string
  created_at: string
}

export interface Config {
  id: number
  votacao_inicio: string // ISO timestamptz
  votacao_fim: string | null
}
