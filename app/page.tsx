'use client';

import { useState } from 'react';
import { JoinForm } from '@/components/JoinForm';
import { Lobby } from '@/components/Lobby';
import { Game } from '@/components/Game';
import { Result } from '@/components/Result';

type GameState = 'join' | 'lobby' | 'game' | 'results';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('join');
  const [roomId, setRoomId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');

  const handleJoinSuccess = (newRoomId: string, newPlayerId: string) => {
    setRoomId(newRoomId);
    setPlayerId(newPlayerId);
    setGameState('lobby');
  };

  const handleGameStart = () => {
    setGameState('game');
  };

  const handleShowResults = () => {
    setGameState('results');
  };

  const handlePlayAgain = () => {
    setGameState('game');
  };

  return (
    <>
      {gameState === 'join' && (
        <JoinForm onJoinSuccess={handleJoinSuccess} />
      )}
      {gameState === 'lobby' && (
        <Lobby
          roomId={roomId}
          playerId={playerId}
          onGameStart={handleGameStart}
        />
      )}
      {gameState === 'game' && (
        <Game
          roomId={roomId}
          playerId={playerId}
          onShowResults={handleShowResults}
        />
      )}
      {gameState === 'results' && (
        <Result
          roomId={roomId}
          playerId={playerId}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}