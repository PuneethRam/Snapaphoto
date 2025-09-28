import { NextRequest, NextResponse } from 'next/server';
import { getRoom, rooms, scorePhoto, saveRooms } from '@/lib/game-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    
    if (!roomId) {
      return NextResponse.json({
        success: false,
        error: 'Room ID is required'
      }, { status: 400 });
    }

    const room = getRoom(roomId.toUpperCase());
    if (!room) {
      return NextResponse.json({
        success: false,
        error: 'Room not found'
      }, { status: 404 });
    }

    // Check if all players have submitted
    if (room.submissions.length < room.players.length) {
      return NextResponse.json({
        success: false,
        error: 'Not all players have submitted yet',
        submitted: room.submissions.length,
        total: room.players.length
      }, { status: 400 });
    }

    // Score all submissions if not already scored
    for (const submission of room.submissions) {
      if (submission.score === undefined && room.prompt) {
        submission.score = await scorePhoto(room.prompt, submission.imageData);
      }
    }

    // Determine winner if not already determined
    if (!room.winner) {
      const sortedSubmissions = [...room.submissions].sort((a, b) => {
        // Sort by score first, then by submission time (earlier is better)
        if ((b.score || 0) !== (a.score || 0)) {
          return (b.score || 0) - (a.score || 0);
        }
        return a.submittedAt - b.submittedAt;
      });

      if (sortedSubmissions.length > 0) {
        const winner = sortedSubmissions[0];
        room.winner = {
          playerId: winner.playerId,
          playerName: winner.playerName,
          score: winner.score || 0
        };
      }
    }

    room.gameState = 'results';
    
    // Save the updated room state
    rooms[roomId.toUpperCase()] = room;
    saveRooms();

    console.log('Results calculated for room:', roomId, 'Winner:', room.winner?.playerName);

    return NextResponse.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get results'
    }, { status: 500 });
  }
}