'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, RotateCcw } from 'lucide-react';
import { Room } from '@/types/game';

interface ResultProps {
  roomId: string;
  playerId: string;
  onPlayAgain: () => void;
}

export function Result({ roomId, playerId, onPlayAgain }: ResultProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pollRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`);
        const data = await response.json();
        
        if (data.success) {
          setRoom(data.room);
          
          // Check if new game started
          if (data.room.gameState === 'playing') {
            onPlayAgain();
          }
        }
      } catch (error) {
        console.error('Error polling room:', error);
      }
    };

    const getResults = async () => {
      try {
        const response = await fetch(`/api/get-results?roomId=${roomId}`);
        const data = await response.json();
        
        if (data.success) {
          setRoom(data.room);
        }
      } catch (error) {
        console.error('Error getting results:', error);
      }
    };

    getResults();
    const interval = setInterval(pollRoom, 1000);
    return () => clearInterval(interval);
  }, [roomId, onPlayAgain]);

  const handlePlayAgain = async () => {
    if (!room || room.host !== playerId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId }),
      });

      const data = await response.json();
      if (data.success) {
        onPlayAgain();
      }
    } catch (error) {
      console.error('Error starting new game:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  const sortedSubmissions = [...room.submissions].sort((a, b) => {
    // Sort by score first, then by submission time (earlier is better)
    if (b.score !== a.score) {
      return (b.score || 0) - (a.score || 0);
    }
    return a.submittedAt - b.submittedAt;
  });

  const isHost = room.host === playerId;
  const winner = sortedSubmissions[0];
  const playerSubmission = room.submissions.find(s => s.playerId === playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Header */}
        <Card className="shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Game Results
            </CardTitle>
            <div className="bg-gradient-to-r from-purple-100 to-cyan-100 p-3 rounded-lg mt-4">
              <p className="text-lg text-gray-800">
                Prompt: <span className="font-medium">{room.prompt}</span>
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Winner Announcement */}
        {winner && (
          <Card className="shadow-2xl bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-12 h-12 text-yellow-600" />
              </div>
              <CardTitle className="text-xl text-yellow-800">
                🎉 Winner: {winner.playerName} 🎉
              </CardTitle>
              <p className="text-yellow-700">
                Score: {winner.score?.toFixed(1)}/10
              </p>
            </CardHeader>
          </Card>
        )}

        {/* All Submissions */}
        <div className="grid gap-4">
          {sortedSubmissions.map((submission, index) => (
            <Card
              key={submission.playerId}
              className={`shadow-lg ${
                index === 0 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' 
                  : 'bg-white/95 backdrop-blur-sm'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-48 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={submission.imageData}
                      alt={`${submission.playerName}'s photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Trophy className="w-5 h-5 text-yellow-600" />}
                      {index === 1 && <Medal className="w-5 h-5 text-gray-500" />}
                      {index === 2 && <Medal className="w-5 h-5 text-amber-600" />}
                      <span className="font-medium text-lg">
                        {submission.playerName}
                      </span>
                      {submission.playerId === playerId && (
                        <Badge variant="outline" className="border-green-600 text-green-700">
                          You
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>Score: {submission.score?.toFixed(1) || '0'}/10</span>
                      </div>
                      <div>
                        Rank: #{index + 1}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Play Again Button */}
        <Card className="shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            {isHost ? (
              <Button
                onClick={handlePlayAgain}
                disabled={loading}
                className="w-full max-w-md h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {loading ? 'Starting New Game...' : 'Play Again'}
              </Button>
            ) : (
              <p className="text-gray-600">
                Waiting for host to start a new game...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}