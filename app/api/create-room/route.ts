import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/game-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 });
    }

    const room = createRoom(name.trim());
    const hostPlayer = room.players[0];

    return NextResponse.json({
      success: true,
      room,
      playerId: hostPlayer.id
    });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create room'
    }, { status: 500 });
  }
}