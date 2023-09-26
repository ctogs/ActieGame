export interface Round {
  actor1Name: string
  actor2Name: string
  actor1Image: string
  actor2Image: string
  movies: string[]
}

export interface GameRoom extends Round {
  players: Record<string, Player>
}

export interface Player {
  displayName: string | null
  host: boolean
  points: number
}