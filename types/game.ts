export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface PhotoSubmission {
  playerId: string;
  playerName: string;
  imageData: string;
  submittedAt: number;
  score?: number;
}

export interface GameWinner {
  playerId: string;
  playerName: string;
  score: number;
}

export interface Room {
  id: string;
  host: string;
  players: Player[];
  gameState: 'lobby' | 'playing' | 'results';
  prompt?: string;
  submissions: PhotoSubmission[];
  winner?: GameWinner;
  createdAt: number;
}