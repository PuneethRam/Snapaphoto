import { NextRequest, NextResponse } from 'next/server';
import { getRoom, rooms, loadRooms } from '@/lib/game-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    
    
    
    if (!roomId) {
      console.log('No room ID provided');
      return NextResponse.json({
        success: false,
        error: 'Room ID is required'
      }, { status: 400 });
    }

    const cleanRoomId = roomId.toUpperCase();
    
    // Force reload from file
    loadRooms();
    
    const room = getRoom(cleanRoomId);
    
    if (!room) {
      return NextResponse.json({
        success: false,
        error: 'Room not found'
      }, { status: 404 });
    }


    return NextResponse.json({
      success: true,
      room,
      debug: {
        submissionCount: room.submissions?.length || 0,
        totalPlayers: room.players.length,
        gameState: room.gameState,
        prompt: room.prompt
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get room'
    }, { status: 500 });
  }
}