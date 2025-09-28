import { Room, Player } from '@/types/game';
import fs from 'fs';
import path from 'path';

// File path for persistent storage in development
const ROOMS_FILE = path.join(process.cwd(), 'temp-rooms.json');

// In-memory storage for rooms
export let rooms: { [roomId: string]: Room } = {};

// Load rooms from file on startup (development persistence)
function loadRooms() {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const data = fs.readFileSync(ROOMS_FILE, 'utf8');
      rooms = JSON.parse(data);
      console.log('Loaded existing rooms:', Object.keys(rooms));
    }
  } catch (error) {
    console.log('No existing rooms file found, starting fresh');
    rooms = {};
  }
}

// Save rooms to file (development persistence)
function saveRooms() {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
  } catch (error) {
    console.error('Failed to save rooms:', error);
  }
}

// Export saveRooms for use in other files
export { saveRooms, loadRooms };

// Clean up old rooms (older than 1 hour)
function cleanupOldRooms() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  Object.keys(rooms).forEach(roomId => {
    if (rooms[roomId].createdAt < oneHourAgo) {
      delete rooms[roomId];
    }
  });
}

// Initialize on import
loadRooms();
cleanupOldRooms();

export function generateRoomId(): string {
  let roomId;
  do {
    roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  } while (rooms[roomId]); // Ensure unique room ID
  return roomId;
}

export function createRoom(hostName: string): Room {
  const roomId = generateRoomId();
  const hostPlayer: Player = {
    id: Math.random().toString(36).substr(2, 9),
    name: hostName,
    joinedAt: Date.now(),
  };

  const room: Room = {
    id: roomId,
    host: hostPlayer.id,
    players: [hostPlayer],
    gameState: 'lobby',
    submissions: [],
    createdAt: Date.now(),
  };

  rooms[roomId] = room;
  saveRooms(); // Persist to file
  console.log('Created room:', roomId, 'Total rooms:', Object.keys(rooms).length);
  return room;
}

export function startGame(roomId: string, playerId: string): { success: boolean; room?: Room; error?: string } {
  loadRooms();
  const room = rooms[roomId];
  
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.host !== playerId) {
    return { success: false, error: 'Only the host can start the game' };
  }

  if (room.players.length < 2) {
    return { success: false, error: 'Need at least 2 players to start' };
  }

  room.gameState = 'playing';
  room.prompt = getRandomPrompt();
  room.submissions = [];
  room.winner = undefined;
  
  saveRooms();
  console.log('Game started for room:', roomId, 'Prompt:', room.prompt);
  return { success: true, room };
}

export function joinRoom(roomId: string, playerName: string): { success: boolean; room?: Room; playerId?: string; error?: string } {
  loadRooms(); // Ensure we have latest data
  console.log('Attempting to join room:', roomId);
  console.log('Available rooms:', Object.keys(rooms));
  
  const room = rooms[roomId];
  
  if (!room) {
    console.log('Room not found. Available rooms:', Object.keys(rooms));
    return { success: false, error: 'Room not found' };
  }

  if (room.players.length >= 5) {
    return { success: false, error: 'Room is full' };
  }

  if (room.gameState !== 'lobby') {
    return { success: false, error: 'Game already in progress' };
  }

  const existingPlayer = room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
  if (existingPlayer) {
    return { success: false, error: 'Name already taken' };
  }

  const newPlayer: Player = {
    id: Math.random().toString(36).substr(2, 9),
    name: playerName,
    joinedAt: Date.now(),
  };

  room.players.push(newPlayer);
  saveRooms(); // Persist changes
  console.log('Player joined room:', roomId, 'Player count:', room.players.length);
  return { success: true, room, playerId: newPlayer.id };
}

export function getRoom(roomId: string): Room | null {
  loadRooms(); // Ensure we have latest data
  return rooms[roomId] || null;
}

// Debug functions
export function getAllRooms() {
  loadRooms();
  return Object.keys(rooms).map(id => ({
    id,
    playerCount: rooms[id].players.length,
    status: rooms[id].gameState,
    createdAt: new Date(rooms[id].createdAt).toLocaleString()
  }));
}

export function debugRooms() {
  loadRooms();
  console.log('Current rooms in memory:', rooms);
  return rooms;
}

// Cleanup function to remove the temp file
export function cleanupTempFile() {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      fs.unlinkSync(ROOMS_FILE);
      console.log('Cleaned up temporary rooms file');
    }
  } catch (error) {
    console.error('Failed to cleanup temp file:', error);
  }
}

export const GAME_PROMPTS = [
  "Show me something red",
  "Find a round object",
  "Show me something that makes you happy",
  "Find something with text on it",
  "Show me something blue",
  "Find something made of wood",
  "Show me your favorite snack",
  "Find something soft",
  "Show me something that reflects light",
  "Find something with buttons",
];

export function getRandomPrompt(): string {
  return GAME_PROMPTS[Math.floor(Math.random() * GAME_PROMPTS.length)];
}

// Real Gemini API scorer
// Real Gemini API scorer
export async function scorePhoto(prompt: string, imageData: string): Promise<number> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('No Gemini API key found, using mock scoring');
    return mockScorePhoto(prompt, imageData);
  }

  try {
    const base64Data = imageData.includes(',')
      ? imageData.split(',')[1]
      : imageData;

    // Use the correct model name
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Rate how well this image matches the prompt "${prompt}" on a scale of 1-10. Consider how clearly the image shows what was requested and how well it fulfills the prompt. Reply with ONLY a single integer from 1 to 10. No words, no punctuation, just the number.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error response:", response.status, errText);
      return mockScorePhoto(prompt, imageData);
    }

    const result = await response.json();
    console.log("Gemini API full response:", JSON.stringify(result, null, 2));

    // Parse the response more carefully
    const candidate = result.candidates?.[0];
    if (!candidate) {
      console.warn("No candidates in response");
      return mockScorePhoto(prompt, imageData);
    }

    const content = candidate.content;
    if (!content) {
      console.warn("No content in candidate");
      return mockScorePhoto(prompt, imageData);
    }

    const parts = content.parts;
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      console.warn("No parts in content");
      return mockScorePhoto(prompt, imageData);
    }

    const scoreText = parts[0].text?.trim();
    console.log("Raw score text from Gemini:", JSON.stringify(scoreText));

    if (scoreText) {
      // Try to extract just the number
      const match = scoreText.match(/\b([1-9]|10)\b/);
      if (match) {
        const parsedScore = parseInt(match[1], 10);
        console.log(`Gemini scored "${prompt}": ${parsedScore}`);
        return parsedScore;
      }
      
      // Try parsing as float and rounding
      const floatScore = parseFloat(scoreText);
      if (!isNaN(floatScore) && floatScore >= 1 && floatScore <= 10) {
        const roundedScore = Math.round(floatScore);
        console.log(`Gemini scored "${prompt}": ${roundedScore} (rounded from ${floatScore})`);
        return roundedScore;
      }
    }

    console.warn("Could not parse Gemini score from:", scoreText);
    return mockScorePhoto(prompt, imageData);

  } catch (err) {
    console.error("Gemini API error:", err);
    return mockScorePhoto(prompt, imageData);
  }
}

// Mock scoring fallback
function mockScorePhoto(prompt: string, imageData: string): number {
  console.log('Using mock scoring for prompt:', prompt);
  
  // Mock scoring based on prompt keywords and random factors
  let score = 5 + Math.random() * 3; // Base score 5-8
  
  // Add some basic keyword matching for demo
  const promptLower = prompt.toLowerCase();
  if (promptLower.includes('red') || promptLower.includes('blue')) {
    score += Math.random() * 2;
  }
  if (promptLower.includes('round')) {
    score += Math.random() * 1.5;
  }
  if (promptLower.includes('text')) {
    score += Math.random() * 1.5;
  }
  if (promptLower.includes('snack') || promptLower.includes('food')) {
    score += Math.random() * 1.5;
  }
  
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}