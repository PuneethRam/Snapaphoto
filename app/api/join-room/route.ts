import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/game-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { roomId, name } = await request.json();
    
    if (!roomId || typeof roomId !== 'string' || !name || typeof name !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Room ID and name are required'
      }, { status: 400 });
    }

    const result = joinRoom(roomId.trim().toUpperCase(), name.trim());
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      room: result.room,
      playerId: result.playerId
    });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to join room'
    }, { status: 500 });
  }
}