import { createClient } from '@supabase/supabase-js'

export type MatchWinner = 0 | 1 | null
export type MatchAnswer = {
  questionId: number
  player: 0 | 1
  selected: 'A' | 'B' | 'C' | 'D'
}

export type MatchRecord = {
  id: string
  completedAt: string
  players: [{ name: string; score: number }, { name: string; score: number }]
  winner: MatchWinner
  answers: MatchAnswer[] | null
}

type MatchRow = {
  id: string
  completed_at: string
  player_one_name: string
  player_one_score: number
  player_two_name: string
  player_two_score: number
  winner_player: 0 | 1 | null
  answers: MatchAnswer[] | null
}

type Database = {
  public: {
    Tables: {
      matches: {
        Row: MatchRow
        Insert: MatchRow
        Update: Partial<MatchRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

function normalizeSupabaseUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined

  const parsed = new URL(value.trim())
  parsed.pathname = parsed.pathname.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '') || '/'
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString().replace(/\/$/, '')
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const sharedMatchesConfigured = Boolean(url && anonKey)

const client = sharedMatchesConfigured
  ? createClient<Database>(url!, anonKey!)
  : undefined

function getClient() {
  if (!client) throw new Error('Falta configurar la conexión con Supabase.')
  return client
}

function toRow(match: MatchRecord): MatchRow {
  return {
    id: match.id,
    completed_at: match.completedAt,
    player_one_name: match.players[0].name,
    player_one_score: match.players[0].score,
    player_two_name: match.players[1].name,
    player_two_score: match.players[1].score,
    winner_player: match.winner,
    answers: match.answers,
  }
}

function fromRow(row: MatchRow): MatchRecord {
  return {
    id: row.id,
    completedAt: row.completed_at,
    players: [
      { name: row.player_one_name, score: row.player_one_score },
      { name: row.player_two_name, score: row.player_two_score },
    ],
    winner: row.winner_player,
    answers: row.answers ?? null,
  }
}

export async function uploadMatches(matches: MatchRecord[]): Promise<void> {
  const supabase = getClient()
  for (let offset = 0; offset < matches.length; offset += 100) {
    const batch = matches.slice(offset, offset + 100).map(toRow)
    const { error } = await supabase
      .from('matches')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw new Error(`No se pudieron sincronizar las partidas: ${error.message}`)
  }
}

export async function fetchSharedMatches(): Promise<MatchRecord[]> {
  const supabase = getClient()
  const pageSize = 1000
  const records: MatchRecord[] = []

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('completed_at', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw new Error(`No se pudo actualizar el reporte: ${error.message}`)
    if (!data) throw new Error('Supabase devolvió una respuesta vacía al leer las partidas.')
    records.push(...data.map(fromRow))
    if (data.length < pageSize) return records
  }
}
