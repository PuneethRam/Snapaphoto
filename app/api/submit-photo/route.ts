import { NextRequest, NextResponse } from 'next/server';
import { getRoom, rooms, saveRooms } from '@/lib/game-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId, imageData } = await request.json();
    
    console.log('=== SUBMIT PHOTO DEBUG ===');
    console.log('Room ID:', roomId);
    console.log('Player ID:', playerId);
    console.log('Image data length:', imageData?.length);
    
    if (!roomId || !playerId || !imageData) {
      console.log('Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Room ID, player ID, and image data are required'
      }, { status: 400 });
    }

    const cleanRoomId = roomId.toUpperCase();
    console.log('Clean room ID:', cleanRoomId);
    console.log('Available rooms:', Object.keys(rooms));
    
    const room = getRoom(cleanRoomId);
    if (!room) {
      console.log('Room not found!');
      return NextResponse.json({
        success: false,
        error: 'Room not found'
      }, { status: 404 });
    }

    console.log('Room found. Current state:', room.gameState);
    console.log('Current submissions:', room.submissions?.length || 0);
    console.log('Total players:', room.players.length);

    if (room.gameState !== 'playing') {
      console.log('Game not in playing state:', room.gameState);
      return NextResponse.json({
        success: false,
        error: 'Game is not in progress'
      }, { status: 400 });
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      console.log('Player not found in room');
      console.log('Looking for player ID:', playerId);
      console.log('Available players:', room.players.map(p => ({ id: p.id, name: p.name })));
      return NextResponse.json({
        success: false,
        error: 'Player not found in room'
      }, { status: 404 });
    }

    console.log('Player found:', player.name);

    // Check if player already submitted
    const existingSubmission = room.submissions.find(s => s.playerId === playerId);
    if (existingSubmission) {
      console.log('Player already submitted');
      return NextResponse.json({
        success: false,
        error: 'Already submitted for this round'
      }, { status: 400 });
    }

    // Add submission
    const newSubmission = {
      playerId,
      playerName: player.name,
      imageData,
      submittedAt: Date.now()
    };

    console.log('Adding new submission for:', player.name);
    room.submissions.push(newSubmission);

    // Update the rooms object directly
    rooms[cleanRoomId] = room;
    
    console.log('After adding submission:');
    console.log('Submissions count:', room.submissions.length);
    console.log('Submissions:', room.submissions.map(s => ({ playerName: s.playerName, submittedAt: new Date(s.submittedAt).toISOString() })));

    // Save changes
    saveRooms();
    
    console.log('Room saved. Final submission count:', room.submissions.length);
    console.log('=== END SUBMIT PHOTO DEBUG ===');

    return NextResponse.json({
      success: true,
      room,
      debug: {
        submissionCount: room.submissions.length,
        totalPlayers: room.players.length,
        playerName: player.name
      }
    });
  } catch (error) {
    console.error('Submit photo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit photo'
    }, { status: 500 });
  }
}