import { NextRequest, NextResponse } from 'next/server';
import { startGame } from '@/lib/game-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId } = await request.json();
    
    if (!roomId || !playerId) {
      return NextResponse.json({
        success: false,
        error: 'Room ID and player ID are required'
      }, { status: 400 });
    }

    console.log('Starting game for room:', roomId);
    const result = await startGame(roomId.toUpperCase(), playerId); // Now await!
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      room: result.room
    });
  } catch (error) {
    console.error('Start game error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start game'
    }, { status: 500 });
  }
}