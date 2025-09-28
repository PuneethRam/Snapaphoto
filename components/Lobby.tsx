'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Copy, Check } from 'lucide-react';
import { Room } from '@/types/game';

interface LobbyProps {
  roomId: string;
  playerId: string;
  onGameStart: () => void;
}

export function Lobby({ roomId, playerId, onGameStart }: LobbyProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const pollRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`);
        const data = await response.json();
        
        if (data.success) {
          setRoom(data.room);
          
          // Check if game started
          if (data.room.gameState === 'playing') {
            onGameStart();
          }
        }
      } catch (error) {
        console.error('Error polling room:', error);
      }
    };

    pollRoom();
    const interval = setInterval(pollRoom, 1000);
    return () => clearInterval(interval);
  }, [roomId, onGameStart]);

  const handleStartGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId }),
      });

      const data = await response.json();
      if (data.success) {
        onGameStart();
      }
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isHost = room.host === playerId;
  const canStartGame = room.players.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">Game Lobby</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-sm text-gray-600">Room ID:</span>
            <code className="bg-gray-100 px-3 py-1 rounded-md font-mono text-lg tracking-wider">
              {roomId}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomId}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-medium text-gray-800">
                Players ({room.players.length}/5)
              </span>
            </div>

            <div className="grid gap-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">{player.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {player.id === room.host && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Host
                      </Badge>
                    )}
                    {player.id === playerId && (
                      <Badge variant="outline" className="border-green-600 text-green-700">
                        You
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {isHost ? (
              <div className="text-center space-y-4">
                {!canStartGame && (
                  <p className="text-sm text-gray-600">
                    Waiting for at least one more player to join...
                  </p>
                )}
                <Button
                  onClick={handleStartGame}
                  disabled={loading || !canStartGame}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium disabled:opacity-50"
                >
                  {loading ? 'Starting Game...' : 'Start Game'}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600">
                  Waiting for the host to start the game...
                </p>
              </div>
            )}

            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>• Each round, you'll get a photo prompt</p>
              <p>• Capture and submit your best photo</p>
              <p>• Winner is decided by relevance and speed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}