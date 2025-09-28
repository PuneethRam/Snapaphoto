'use client';

import { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Send, RotateCcw, Users } from 'lucide-react';
import { Room } from '@/types/game';

interface GameProps {
  roomId: string;
  playerId: string;
  onShowResults: () => void;
}

export function Game({ roomId, playerId, onShowResults }: GameProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    const pollRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`);
        const data = await response.json();
        
        if (data.success) {
          setRoom(data.room);
          
          // Check if player already submitted
          const playerSubmission = data.room.submissions?.find((s: any) => s.playerId === playerId);
          if (playerSubmission && !submitted) {
            setSubmitted(true);
          }
          
          // Check if results are ready (all players submitted)
          if (data.room.submissions && data.room.submissions.length >= data.room.players.length) {
            const resultsResponse = await fetch(`/api/get-results?roomId=${roomId}`);
            const resultsData = await resultsResponse.json();
            
            if (resultsData.success && resultsData.room.gameState === 'results') {
              onShowResults();
            }
          }
          
          // Also check if game state changed to results
          if (data.room.gameState === 'results') {
            onShowResults();
          }
        }
      } catch (error) {
        console.error('Error polling room:', error);
      }
    };

    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [roomId, onShowResults, playerId, submitted]);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const submitPhoto = async () => {
    if (!capturedImage || !room) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/submit-photo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId,
          playerId,
          imageData: capturedImage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert('Failed to submit photo: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting photo:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  const submissionsCount = room.submissions?.length || 0;
  const totalPlayers = room.players.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Prompt Card */}
        <Card className="shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Photo Challenge
            </CardTitle>
            <div className="bg-gradient-to-r from-purple-100 to-cyan-100 p-4 rounded-lg mt-4">
              <p className="text-xl font-medium text-gray-800">
                {room.prompt || 'Loading prompt...'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Submitted: {submissionsCount}/{totalPlayers}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Camera/Photo Card */}
        <Card className="shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-full max-w-md mx-auto aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Your submission"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Photo submitted
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✓ Photo submitted!
                  </div>
                  <p className="text-gray-600">
                    Waiting for other players to submit their photos...
                  </p>
                  {submissionsCount >= totalPlayers && (
                    <p className="text-sm text-blue-600">
                      All photos submitted! Calculating results...
                    </p>
                  )}
                </div>
              </div>
            ) : capturedImage ? (
              <div className="text-center space-y-4">
                <div className="w-full max-w-md mx-auto aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={retake}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </Button>
                  <Button
                    onClick={submitPhoto}
                    disabled={submitting}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Submit Photo'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full max-w-md mx-auto aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: facingMode,
                      width: { ideal: 1280 },
                      height: { ideal: 720 }
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={toggleCamera}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Flip Camera
                  </Button>
                  <Button
                    onClick={capture}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2 px-8"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}