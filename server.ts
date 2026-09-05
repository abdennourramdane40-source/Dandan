import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  User,
  ChatMessage,
  DrawStroke,
  ActiveGameState,
  DrawAndGuessState,
  TriviaState,
  WordScrambleState,
  ConnectFourState,
  GameType
} from './src/types';
import { TRIVIA_QUESTIONS, DRAWING_WORDS, SCRAMBLE_WORDS } from './src/gameData';

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

interface ConnectedUser {
  ws: WebSocket;
  user: User;
}

interface Room {
  id: string;
  name: string;
  users: Map<string, ConnectedUser>;
  messages: ChatMessage[];
  activeGame: ActiveGameState | null;
  canvasStrokes: DrawStroke[];
  timer?: NodeJS.Timeout;
  gameData?: any; // internal state like full drawing word or trivia question index
  passcode?: string;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string, defaultName?: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    const formattedName =
      defaultName ||
      (roomId === 'lounge-1'
        ? 'Chill Lounge & Chat'
        : roomId === 'party-1'
        ? 'Party Games Arena'
        : roomId === 'trivia-1'
        ? 'Trivia & Brainteasers'
        : `Room #${roomId.toUpperCase()}`);

    room = {
      id: roomId,
      name: formattedName,
      users: new Map(),
      messages: [
        {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Hangout Host',
          avatarColor: '#6366f1',
          text: `Welcome to ${formattedName}! Turn on your mic/cam or pick a party game to play together.`,
          timestamp: Date.now(),
          type: 'system'
        }
      ],
      activeGame: null,
      canvasStrokes: []
    };
    rooms.set(roomId, room);
  }
  return room;
}

// Pre-seed default public rooms
getOrCreateRoom('lounge-1', 'Chill Lounge & Chat');
getOrCreateRoom('party-1', 'Party Games Arena');
getOrCreateRoom('trivia-1', 'Trivia & Brainteasers');

function broadcastToRoom(
  room: Room,
  payload: any,
  excludeUserId?: string
) {
  const data = JSON.stringify(payload);
  room.users.forEach(({ ws, user }) => {
    if (excludeUserId && user.id === excludeUserId) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function sendToUser(room: Room, userId: string, payload: any) {
  const cu = room.users.get(userId);
  if (cu && cu.ws.readyState === WebSocket.OPEN) {
    cu.ws.send(JSON.stringify(payload));
  }
}

function clearRoomTimer(room: Room) {
  if (room.timer) {
    clearInterval(room.timer);
    clearTimeout(room.timer);
    room.timer = undefined;
  }
}

// ================= GAME LOGIC =================

function startDrawAndGuess(room: Room) {
  clearRoomTimer(room);
  room.canvasStrokes = [];
  broadcastToRoom(room, { type: 'canvas_cleared' });

  const userList = Array.from(room.users.values()).map((cu) => cu.user);
  if (userList.length === 0) return;

  const drawerIndex = Math.floor(Math.random() * userList.length);
  const drawer = userList[drawerIndex];
  const wordItem =
    DRAWING_WORDS[Math.floor(Math.random() * DRAWING_WORDS.length)];

  const scores: Record<string, number> = {};
  userList.forEach((u) => {
    scores[u.id] = (room.activeGame as any)?.scores?.[u.id] || u.score || 0;
  });

  const state: DrawAndGuessState = {
    gameType: 'draw_and_guess',
    drawerId: drawer.id,
    drawerName: drawer.name,
    word: wordItem.word,
    maskedWord: wordItem.word.replace(/[A-Z0-9]/g, '_ '),
    category: wordItem.category,
    round: 1,
    totalRounds: 3,
    timeLeft: 45,
    roundDuration: 45,
    status: 'drawing',
    guessedUserIds: [],
    scores
  };

  room.activeGame = state;
  room.gameData = { currentWord: wordItem.word };

  // Broadcast sanitized state to all non-drawers (mask word)
  room.users.forEach(({ ws, user }) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (user.id === drawer.id) {
      ws.send(JSON.stringify({ type: 'game_started', game: state }));
    } else {
      const sanitized = { ...state, word: '' };
      ws.send(JSON.stringify({ type: 'game_started', game: sanitized }));
    }
  });

  broadcastToRoom(room, {
    type: 'new_message',
    message: {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'Game Bot',
      avatarColor: '#f59e0b',
      text: `🎨 Draw & Guess started! ${drawer.name} is drawing. Guess in chat!`,
      timestamp: Date.now(),
      type: 'system'
    }
  });

  room.timer = setInterval(() => {
    if (!room.activeGame || room.activeGame.gameType !== 'draw_and_guess') {
      clearRoomTimer(room);
      return;
    }

    const dg = room.activeGame as DrawAndGuessState;
    dg.timeLeft -= 1;

    if (dg.timeLeft <= 0) {
      // Round end
      dg.status = 'round_end';
      dg.word = room.gameData.currentWord;
      broadcastToRoom(room, { type: 'game_updated', game: dg });
      broadcastToRoom(room, {
        type: 'new_message',
        message: {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Game Bot',
          avatarColor: '#f59e0b',
          text: `⏰ Time's up! The word was "${room.gameData.currentWord}".`,
          timestamp: Date.now(),
          type: 'system'
        }
      });
      clearRoomTimer(room);

      // Transition to next round after 4s
      setTimeout(() => {
        if (room.activeGame?.gameType === 'draw_and_guess') {
          startDrawAndGuess(room);
        }
      }, 4000);
      return;
    }

    broadcastToRoom(room, {
      type: 'game_timer_tick',
      timeLeft: dg.timeLeft
    });
  }, 1000);
}

function startTrivia(room: Room) {
  clearRoomTimer(room);

  // Shuffle trivia questions
  const questions = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  let qIdx = 0;
  const totalRounds = 5;

  const userList = Array.from(room.users.values()).map((cu) => cu.user);
  const scores: Record<string, number> = {};
  userList.forEach((u) => {
    scores[u.id] = (room.activeGame as any)?.scores?.[u.id] || u.score || 0;
  });

  const nextQuestion = () => {
    if (qIdx >= totalRounds || qIdx >= questions.length) {
      // Game over
      const finalState: TriviaState = {
        gameType: 'trivia',
        round: totalRounds,
        totalRounds,
        question: null,
        timeLeft: 0,
        status: 'game_over',
        userAnswers: {},
        scores
      };
      room.activeGame = finalState;
      broadcastToRoom(room, { type: 'game_updated', game: finalState });
      broadcastToRoom(room, {
        type: 'new_message',
        message: {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Game Bot',
          avatarColor: '#10b981',
          text: `🏆 Trivia ended! Great game everyone!`,
          timestamp: Date.now(),
          type: 'system'
        }
      });
      clearRoomTimer(room);
      return;
    }

    const currentQ = questions[qIdx];
    const triviaState: TriviaState = {
      gameType: 'trivia',
      round: qIdx + 1,
      totalRounds,
      question: {
        id: `q-${qIdx}`,
        category: currentQ.category,
        question: currentQ.question,
        options: currentQ.options
      },
      timeLeft: 12,
      status: 'question',
      userAnswers: {},
      scores
    };

    room.activeGame = triviaState;
    room.gameData = { currentQ, qIdx };
    broadcastToRoom(room, { type: 'game_started', game: triviaState });

    clearRoomTimer(room);
    room.timer = setInterval(() => {
      if (!room.activeGame || room.activeGame.gameType !== 'trivia') {
        clearRoomTimer(room);
        return;
      }
      const ts = room.activeGame as TriviaState;
      ts.timeLeft -= 1;

      if (ts.timeLeft <= 0) {
        clearRoomTimer(room);
        // Reveal answers
        ts.status = 'reveal';
        ts.correctIndex = currentQ.correctIndex;
        ts.explanation = currentQ.explanation;

        // Score tallying
        const lastRoundPoints: Record<string, number> = {};
        Object.entries(ts.userAnswers).forEach(([uid, ansIdx]) => {
          if (ansIdx === currentQ.correctIndex) {
            const pts = 100;
            scores[uid] = (scores[uid] || 0) + pts;
            lastRoundPoints[uid] = pts;
            const target = room.users.get(uid);
            if (target) target.user.score = scores[uid];
          }
        });
        ts.lastRoundPoints = lastRoundPoints;
        ts.scores = { ...scores };

        broadcastToRoom(room, { type: 'game_updated', game: ts });

        // Wait 4 seconds, then proceed to next question
        setTimeout(() => {
          if (room.activeGame?.gameType === 'trivia') {
            qIdx++;
            nextQuestion();
          }
        }, 4000);
        return;
      }

      broadcastToRoom(room, {
        type: 'game_timer_tick',
        timeLeft: ts.timeLeft
      });
    }, 1000);
  };

  nextQuestion();
}

function scrambleWord(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const res = arr.join('');
  return res === word ? scrambleWord(word) : res;
}

function startWordScramble(room: Room) {
  clearRoomTimer(room);

  const item = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
  const userList = Array.from(room.users.values()).map((cu) => cu.user);
  const scores: Record<string, number> = {};
  userList.forEach((u) => {
    scores[u.id] = (room.activeGame as any)?.scores?.[u.id] || u.score || 0;
  });

  const state: WordScrambleState = {
    gameType: 'word_scramble',
    category: item.category,
    scrambledWord: scrambleWord(item.word),
    hint: item.hint,
    wordLength: item.word.length,
    timeLeft: 30,
    round: 1,
    totalRounds: 5,
    status: 'playing',
    solvedBy: null,
    scores
  };

  room.activeGame = state;
  room.gameData = { currentWord: item.word };
  broadcastToRoom(room, { type: 'game_started', game: state });

  broadcastToRoom(room, {
    type: 'new_message',
    message: {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'Game Bot',
      avatarColor: '#8b5cf6',
      text: `🧩 Word Scramble started! Unscramble: "${state.scrambledWord}". Type your guess in chat!`,
      timestamp: Date.now(),
      type: 'system'
    }
  });

  room.timer = setInterval(() => {
    if (!room.activeGame || room.activeGame.gameType !== 'word_scramble') {
      clearRoomTimer(room);
      return;
    }

    const wsState = room.activeGame as WordScrambleState;
    wsState.timeLeft -= 1;

    if (wsState.timeLeft <= 0) {
      clearRoomTimer(room);
      wsState.status = 'round_end';
      wsState.revealedWord = room.gameData.currentWord;
      broadcastToRoom(room, { type: 'game_updated', game: wsState });
      broadcastToRoom(room, {
        type: 'new_message',
        message: {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Game Bot',
          avatarColor: '#8b5cf6',
          text: `⏰ Time up! The word was "${room.gameData.currentWord}".`,
          timestamp: Date.now(),
          type: 'system'
        }
      });

      setTimeout(() => {
        if (room.activeGame?.gameType === 'word_scramble') {
          startWordScramble(room);
        }
      }, 3500);
      return;
    }

    broadcastToRoom(room, {
      type: 'game_timer_tick',
      timeLeft: wsState.timeLeft
    });
  }, 1000);
}

function checkConnectFourWin(board: (string | null)[][]): {
  winner: 'p1' | 'p2' | null;
  line: [number, number][] | null;
} {
  const rows = 6;
  const cols = 7;

  // Horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const val = board[r][c];
      if (
        val &&
        val === board[r][c + 1] &&
        val === board[r][c + 2] &&
        val === board[r][c + 3]
      ) {
        return {
          winner: val as 'p1' | 'p2',
          line: [
            [r, c],
            [r, c + 1],
            [r, c + 2],
            [r, c + 3]
          ]
        };
      }
    }
  }

  // Vertical
  for (let r = 0; r <= rows - 4; r++) {
    for (let c = 0; c < cols; c++) {
      const val = board[r][c];
      if (
        val &&
        val === board[r + 1][c] &&
        val === board[r + 2][c] &&
        val === board[r + 3][c]
      ) {
        return {
          winner: val as 'p1' | 'p2',
          line: [
            [r, c],
            [r + 1, c],
            [r + 2, c],
            [r + 3, c]
          ]
        };
      }
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r <= rows - 4; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const val = board[r][c];
      if (
        val &&
        val === board[r + 1][c + 1] &&
        val === board[r + 2][c + 2] &&
        val === board[r + 3][c + 3]
      ) {
        return {
          winner: val as 'p1' | 'p2',
          line: [
            [r, c],
            [r + 1, c + 1],
            [r + 2, c + 2],
            [r + 3, c + 3]
          ]
        };
      }
    }
  }

  // Diagonal Up-Right
  for (let r = 3; r < rows; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const val = board[r][c];
      if (
        val &&
        val === board[r - 1][c + 1] &&
        val === board[r - 2][c + 2] &&
        val === board[r - 3][c + 3]
      ) {
        return {
          winner: val as 'p1' | 'p2',
          line: [
            [r, c],
            [r - 1, c + 1],
            [r - 2, c + 2],
            [r - 3, c + 3]
          ]
        };
      }
    }
  }

  return { winner: null, line: null };
}

function startConnectFour(room: Room, hostUser?: User) {
  clearRoomTimer(room);

  const emptyBoard: (string | null)[][] = Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));

  const users = Array.from(room.users.values()).map((cu) => cu.user);
  const p1 = hostUser || users[0] || null;
  const p2 = users.find((u) => u.id !== p1?.id) || null;

  const state: ConnectFourState = {
    gameType: 'connect_four',
    board: emptyBoard,
    p1Id: p1 ? p1.id : null,
    p1Name: p1 ? p1.name : null,
    p2Id: p2 ? p2.id : null,
    p2Name: p2 ? p2.name : null,
    currentTurn: 'p1',
    winner: null,
    winningLine: null
  };

  room.activeGame = state;
  broadcastToRoom(room, { type: 'game_started', game: state });

  broadcastToRoom(room, {
    type: 'new_message',
    message: {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'Game Bot',
      avatarColor: '#ec4899',
      text: `🔴 Connect 4 started! ${p1 ? p1.name : 'Waiting for P1'} vs ${
        p2 ? p2.name : 'Waiting for P2'
      }.`,
      timestamp: Date.now(),
      type: 'system'
    }
  });
}

// ================= WEBSOCKET CONNECTION HANDLER =================

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on('message', (raw: string) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'join_room') {
        const { roomId, user: initialUser, passcode } = msg;
        currentRoomId = roomId || 'lounge-1';
        const room = getOrCreateRoom(currentRoomId);

        // Check room password if set
        if (room.passcode && room.passcode !== passcode) {
          ws.send(
            JSON.stringify({
              type: 'join_error',
              error: 'invalid_passcode',
              message: 'Incorrect room passcode. Please try again.'
            })
          );
          return;
        }

        // Set room passcode if newly created room with passcode
        if (!room.passcode && passcode) {
          room.passcode = String(passcode).trim();
        }

        const isFirst = room.users.size === 0;
        const finalUser: User = {
          id: initialUser.id || `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: initialUser.name || 'Hangout Guest',
          username:
            initialUser.username ||
            (initialUser.name
              ? initialUser.name.toLowerCase().replace(/[^a-z0-9_]/g, '')
              : 'player'),
          avatarColor: initialUser.avatarColor || '#3b82f6',
          avatarIcon: initialUser.avatarIcon || 'smile',
          avatarUrl: initialUser.avatarUrl || undefined,
          bio: initialUser.bio || '',
          friends: initialUser.friends || [],
          isHost: isFirst,
          isCamOn: false,
          isMicOn: false,
          isSpeaking: false,
          score: 0
        };

        currentUserId = finalUser.id;
        room.users.set(finalUser.id, { ws, user: finalUser });

        // Send full room state to this user
        // If Draw & Guess is in progress, mask word if not drawer
        let clientGameState = room.activeGame;
        if (
          clientGameState &&
          clientGameState.gameType === 'draw_and_guess' &&
          clientGameState.drawerId !== finalUser.id &&
          clientGameState.status === 'drawing'
        ) {
          clientGameState = { ...clientGameState, word: '' };
        }

        const roomStatePayload = {
          type: 'room_state',
          roomId: room.id,
          roomName: room.name,
          hasPassword: Boolean(room.passcode),
          users: Array.from(room.users.values()).map((cu) => cu.user),
          activeGame: clientGameState,
          recentMessages: room.messages.slice(-50),
          canvasStrokes: room.canvasStrokes,
          yourUserId: finalUser.id
        };
        ws.send(JSON.stringify(roomStatePayload));

        // Notify others
        broadcastToRoom(
          room,
          {
            type: 'user_joined',
            user: finalUser
          },
          finalUser.id
        );

        // System message in chat
        const joinMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          senderId: 'system',
          senderName: 'System',
          avatarColor: finalUser.avatarColor,
          text: `${finalUser.name} joined the hangout! 👋`,
          timestamp: Date.now(),
          type: 'system'
        };
        room.messages.push(joinMsg);
        broadcastToRoom(room, { type: 'new_message', message: joinMsg });
        return;
      }

      if (!currentRoomId || !currentUserId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const currentUser = room.users.get(currentUserId)?.user;
      if (!currentUser) return;

      // CHAT MESSAGE
      if (msg.type === 'chat_message') {
        const text = String(msg.text || '').trim();
        if (!text) return;

        // Check active game word guesses
        let handledAsGameGuess = false;

        // 1. Draw and Guess
        if (
          room.activeGame &&
          room.activeGame.gameType === 'draw_and_guess' &&
          room.activeGame.status === 'drawing'
        ) {
          const dg = room.activeGame as DrawAndGuessState;
          const targetWord = room.gameData?.currentWord || '';

          if (currentUser.id === dg.drawerId) {
            // Drawer chatting or giving hints
          } else if (
            text.toUpperCase().trim() === targetWord.toUpperCase().trim() &&
            !dg.guessedUserIds.includes(currentUser.id)
          ) {
            // Correct guess!
            handledAsGameGuess = true;
            dg.guessedUserIds.push(currentUser.id);

            // Award points: faster guesses = more points
            const guesserPoints = Math.max(50, Math.floor(dg.timeLeft * 4));
            const drawerPoints = 30;

            dg.scores[currentUser.id] = (dg.scores[currentUser.id] || 0) + guesserPoints;
            dg.scores[dg.drawerId] = (dg.scores[dg.drawerId] || 0) + drawerPoints;

            currentUser.score = dg.scores[currentUser.id];
            const drawerObj = room.users.get(dg.drawerId);
            if (drawerObj) drawerObj.user.score = dg.scores[dg.drawerId];

            const correctMsg: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random()}`,
              senderId: currentUser.id,
              senderName: currentUser.name,
              avatarColor: currentUser.avatarColor,
              text: `🎉 Guessed the word correctly! (+${guesserPoints} pts)`,
              timestamp: Date.now(),
              type: 'correct_guess'
            };
            room.messages.push(correctMsg);
            broadcastToRoom(room, { type: 'new_message', message: correctMsg });

            // Check if all non-drawers have guessed
            const nonDrawers = Array.from(room.users.values()).filter(
              (cu) => cu.user.id !== dg.drawerId
            );
            if (dg.guessedUserIds.length >= nonDrawers.length) {
              // End round early!
              dg.status = 'round_end';
              dg.word = targetWord;
              broadcastToRoom(room, { type: 'game_updated', game: dg });
              clearRoomTimer(room);

              setTimeout(() => {
                if (room.activeGame?.gameType === 'draw_and_guess') {
                  startDrawAndGuess(room);
                }
              }, 3500);
            } else {
              // Update state for non-drawer (keeping word hidden)
              room.users.forEach(({ ws: cws, user: u }) => {
                if (cws.readyState !== WebSocket.OPEN) return;
                if (u.id === dg.drawerId || dg.guessedUserIds.includes(u.id)) {
                  cws.send(JSON.stringify({ type: 'game_updated', game: dg }));
                } else {
                  cws.send(
                    JSON.stringify({
                      type: 'game_updated',
                      game: { ...dg, word: '' }
                    })
                  );
                }
              });
            }
          }
        }

        // 2. Word Scramble
        if (
          !handledAsGameGuess &&
          room.activeGame &&
          room.activeGame.gameType === 'word_scramble' &&
          room.activeGame.status === 'playing'
        ) {
          const wsState = room.activeGame as WordScrambleState;
          const targetWord = room.gameData?.currentWord || '';

          if (text.toUpperCase().trim() === targetWord.toUpperCase().trim()) {
            handledAsGameGuess = true;
            clearRoomTimer(room);
            wsState.status = 'round_end';
            wsState.solvedBy = { id: currentUser.id, name: currentUser.name };
            wsState.revealedWord = targetWord;

            const pts = Math.max(50, Math.floor(wsState.timeLeft * 5));
            wsState.scores[currentUser.id] =
              (wsState.scores[currentUser.id] || 0) + pts;
            currentUser.score = wsState.scores[currentUser.id];

            const solveMsg: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random()}`,
              senderId: currentUser.id,
              senderName: currentUser.name,
              avatarColor: currentUser.avatarColor,
              text: `🎯 Solved the scramble "${targetWord}"! (+${pts} pts)`,
              timestamp: Date.now(),
              type: 'correct_guess'
            };
            room.messages.push(solveMsg);
            broadcastToRoom(room, { type: 'new_message', message: solveMsg });
            broadcastToRoom(room, { type: 'game_updated', game: wsState });

            setTimeout(() => {
              if (room.activeGame?.gameType === 'word_scramble') {
                startWordScramble(room);
              }
            }, 3500);
          }
        }

        if (!handledAsGameGuess) {
          const chatMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            avatarColor: currentUser.avatarColor,
            text,
            timestamp: Date.now(),
            type: 'chat',
            reactions: {}
          };
          room.messages.push(chatMsg);
          if (room.messages.length > 100) room.messages.shift();
          broadcastToRoom(room, { type: 'new_message', message: chatMsg });
        }
        return;
      }

      // MESSAGE REACTION
      if (msg.type === 'message_reaction') {
        const { messageId, emoji } = msg;
        const targetMsg = room.messages.find((m) => m.id === messageId);
        if (targetMsg) {
          targetMsg.reactions = targetMsg.reactions || {};
          const usersWithEmoji = targetMsg.reactions[emoji] || [];
          if (usersWithEmoji.includes(currentUser.id)) {
            // Remove reaction
            targetMsg.reactions[emoji] = usersWithEmoji.filter(
              (id) => id !== currentUser.id
            );
          } else {
            targetMsg.reactions[emoji] = [...usersWithEmoji, currentUser.id];
          }
          broadcastToRoom(room, {
            type: 'message_reaction_updated',
            messageId,
            reactions: targetMsg.reactions
          });
        }
        return;
      }

      // FLOATING REACTION
      if (msg.type === 'floating_reaction') {
        broadcastToRoom(room, {
          type: 'floating_reaction',
          reaction: {
            id: `react-${Date.now()}-${Math.random()}`,
            emoji: msg.emoji || '❤️',
            senderName: currentUser.name,
            x: Math.floor(Math.random() * 80) + 10 // 10% to 90% horizontal position
          }
        });
        return;
      }

      // MEDIA TOGGLES (CAM / MIC / SPEAKING)
      if (msg.type === 'toggle_media') {
        if (typeof msg.isCamOn === 'boolean') currentUser.isCamOn = msg.isCamOn;
        if (typeof msg.isMicOn === 'boolean') currentUser.isMicOn = msg.isMicOn;
        if (typeof msg.isSpeaking === 'boolean')
          currentUser.isSpeaking = msg.isSpeaking;

        broadcastToRoom(room, {
          type: 'user_updated',
          user: currentUser
        });
        return;
      }

      // USER PROFILE UPDATE
      if (msg.type === 'update_profile') {
        if (msg.name) currentUser.name = String(msg.name).slice(0, 24);
        if (msg.username) currentUser.username = String(msg.username).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18);
        if (msg.avatarColor) currentUser.avatarColor = msg.avatarColor;
        if (msg.avatarIcon) currentUser.avatarIcon = msg.avatarIcon;
        if (msg.avatarUrl !== undefined) currentUser.avatarUrl = msg.avatarUrl;
        if (msg.bio !== undefined) currentUser.bio = String(msg.bio).slice(0, 160);

        broadcastToRoom(room, {
          type: 'user_updated',
          user: currentUser
        });
        return;
      }

      // START GAME
      if (msg.type === 'start_game') {
        const gameType: GameType = msg.gameType;
        if (gameType === 'draw_and_guess') {
          startDrawAndGuess(room);
        } else if (gameType === 'trivia') {
          startTrivia(room);
        } else if (gameType === 'word_scramble') {
          startWordScramble(room);
        } else if (gameType === 'connect_four') {
          startConnectFour(room, currentUser);
        }
        return;
      }

      // END GAME
      if (msg.type === 'end_game') {
        clearRoomTimer(room);
        room.activeGame = null;
        room.canvasStrokes = [];
        broadcastToRoom(room, { type: 'game_ended' });
        broadcastToRoom(room, {
          type: 'new_message',
          message: {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'Game Bot',
            avatarColor: '#6366f1',
            text: `Game was closed by ${currentUser.name}. Hanging out in lounge mode.`,
            timestamp: Date.now(),
            type: 'system'
          }
        });
        return;
      }

      // DRAW CANVAS STROKES
      if (msg.type === 'draw_stroke') {
        if (
          room.activeGame?.gameType === 'draw_and_guess' &&
          room.activeGame.drawerId === currentUser.id
        ) {
          const stroke: DrawStroke = msg.stroke;
          room.canvasStrokes.push(stroke);
          // Relay stroke to all other users in room
          broadcastToRoom(room, { type: 'draw_stroke', stroke }, currentUser.id);
        }
        return;
      }

      if (msg.type === 'clear_canvas') {
        if (
          room.activeGame?.gameType === 'draw_and_guess' &&
          room.activeGame.drawerId === currentUser.id
        ) {
          room.canvasStrokes = [];
          broadcastToRoom(room, { type: 'canvas_cleared' });
        }
        return;
      }

      // TRIVIA ANSWER SUBMISSION
      if (msg.type === 'submit_trivia_answer') {
        if (
          room.activeGame?.gameType === 'trivia' &&
          room.activeGame.status === 'question'
        ) {
          const ts = room.activeGame as TriviaState;
          ts.userAnswers[currentUser.id] = Number(msg.answerIndex);
          broadcastToRoom(room, {
            type: 'user_answered_trivia',
            userId: currentUser.id
          });
        }
        return;
      }

      // CONNECT 4 MOVE
      if (msg.type === 'connect_four_drop') {
        if (
          room.activeGame?.gameType === 'connect_four' &&
          !room.activeGame.winner
        ) {
          const c4 = room.activeGame as ConnectFourState;
          const isP1 = currentUser.id === c4.p1Id;
          const isP2 = currentUser.id === c4.p2Id;

          // Check whose turn
          if (
            (c4.currentTurn === 'p1' && isP1) ||
            (c4.currentTurn === 'p2' && isP2)
          ) {
            const col = Number(msg.column);
            if (col >= 0 && col < 7) {
              // Find lowest empty row in col
              let placedRow = -1;
              for (let r = 5; r >= 0; r--) {
                if (c4.board[r][col] === null) {
                  placedRow = r;
                  c4.board[r][col] = c4.currentTurn;
                  break;
                }
              }

              if (placedRow !== -1) {
                // Check win condition
                const winCheck = checkConnectFourWin(c4.board);
                if (winCheck.winner) {
                  c4.winner = winCheck.winner;
                  c4.winningLine = winCheck.line;
                  const winnerName =
                    winCheck.winner === 'p1' ? c4.p1Name : c4.p2Name;
                  broadcastToRoom(room, {
                    type: 'new_message',
                    message: {
                      id: `sys-${Date.now()}`,
                      senderId: 'system',
                      senderName: 'Connect 4',
                      avatarColor: '#ec4899',
                      text: `🎉 ${winnerName} won the Connect 4 match!`,
                      timestamp: Date.now(),
                      type: 'system'
                    }
                  });
                } else {
                  // Check draw (board full)
                  const isBoardFull = c4.board[0].every((cell) => cell !== null);
                  if (isBoardFull) {
                    c4.winner = 'draw';
                  } else {
                    // Switch turn
                    c4.currentTurn = c4.currentTurn === 'p1' ? 'p2' : 'p1';
                  }
                }
                broadcastToRoom(room, { type: 'game_updated', game: c4 });
              }
            }
          }
        }
        return;
      }

      // CONNECT 4 JOIN AS PLAYER
      if (msg.type === 'connect_four_join') {
        if (room.activeGame?.gameType === 'connect_four') {
          const c4 = room.activeGame as ConnectFourState;
          if (msg.slot === 1 && !c4.p1Id) {
            c4.p1Id = currentUser.id;
            c4.p1Name = currentUser.name;
          } else if (msg.slot === 2 && !c4.p2Id && c4.p1Id !== currentUser.id) {
            c4.p2Id = currentUser.id;
            c4.p2Name = currentUser.name;
          }
          broadcastToRoom(room, { type: 'game_updated', game: c4 });
        }
        return;
      }

      // WEBRTC SIGNALING FOR REAL LIVE VIDEO/AUDIO MESH
      if (msg.type === 'signal') {
        const { targetUserId, signalData } = msg;
        sendToUser(room, targetUserId, {
          type: 'signal',
          fromUserId: currentUser.id,
          signalData
        });
        return;
      }
    } catch (err) {
      console.error('Error processing websocket message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentUserId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const exitingUser = room.users.get(currentUserId)?.user;
        room.users.delete(currentUserId);

        if (exitingUser) {
          broadcastToRoom(room, {
            type: 'user_left',
            userId: currentUserId
          });

          // System message
          const leaveMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random()}`,
            senderId: 'system',
            senderName: 'System',
            avatarColor: exitingUser.avatarColor,
            text: `${exitingUser.name} left the room.`,
            timestamp: Date.now(),
            type: 'system'
          };
          room.messages.push(leaveMsg);
          broadcastToRoom(room, { type: 'new_message', message: leaveMsg });

          // If exiting user was the drawer in Draw & Guess
          if (
            room.activeGame?.gameType === 'draw_and_guess' &&
            room.activeGame.drawerId === currentUserId
          ) {
            clearRoomTimer(room);
            broadcastToRoom(room, {
              type: 'new_message',
              message: {
                id: `sys-${Date.now()}`,
                senderId: 'system',
                senderName: 'Game Bot',
                avatarColor: '#f59e0b',
                text: `The drawer left! Selecting a new drawer...`,
                timestamp: Date.now(),
                type: 'system'
              }
            });
            setTimeout(() => {
              if (room.users.size > 0) startDrawAndGuess(room);
              else room.activeGame = null;
            }, 2000);
          }

          // If exiting user was host, promote next user
          if (exitingUser.isHost && room.users.size > 0) {
            const nextHost = Array.from(room.users.values())[0].user;
            nextHost.isHost = true;
            broadcastToRoom(room, {
              type: 'user_updated',
              user: nextHost
            });
          }
        }
      }
    }
  });
});

// REST API ROUTES
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map((r) => ({
    roomId: r.id,
    roomName: r.name,
    userCount: r.users.size,
    hasPassword: Boolean(r.passcode),
    activeGameType: r.activeGame ? r.activeGame.gameType : null
  }));
  res.json(roomList);
});

app.get('/api/users/search', (req, res) => {
  const query = String(req.query.username || '').toLowerCase().trim();
  if (!query) {
    return res.json([]);
  }

  const results: any[] = [];
  const seenIds = new Set<string>();

  rooms.forEach((room) => {
    room.users.forEach(({ user }) => {
      if (!seenIds.has(user.id)) {
        const uName = (user.username || user.name).toLowerCase();
        if (uName.includes(query)) {
          seenIds.add(user.id);
          results.push({
            id: user.id,
            name: user.name,
            username: user.username || user.name.toLowerCase().replace(/\s+/g, '_'),
            avatarColor: user.avatarColor,
            avatarIcon: user.avatarIcon,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            currentRoomId: room.id,
            isOnline: true
          });
        }
      }
    });
  });

  res.json(results.slice(0, 10));
});

// Vite middleware in dev vs static files in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Live Hangout server running at http://localhost:${PORT}`);
  });
}

start();
