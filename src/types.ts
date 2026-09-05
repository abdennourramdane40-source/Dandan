export type GameType = 'draw_and_guess' | 'trivia' | 'word_scramble' | 'connect_four';

export interface User {
  id: string;
  name: string;
  username?: string;
  avatarColor: string;
  avatarIcon: string;
  avatarUrl?: string;
  bio?: string;
  friends?: string[];
  isHost: boolean;
  isCamOn: boolean;
  isMicOn: boolean;
  isSpeaking: boolean;
  score: number;
}

export interface FriendProfile {
  id: string;
  name: string;
  username?: string;
  avatarColor: string;
  avatarIcon: string;
  avatarUrl?: string;
  bio?: string;
  isOnline?: boolean;
  currentRoomId?: string;
  addedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarColor: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system' | 'guess' | 'correct_guess';
  reactions?: Record<string, string[]>; // emoji -> userIds
}

export interface DrawStroke {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
}

export interface DrawAndGuessState {
  gameType: 'draw_and_guess';
  drawerId: string;
  drawerName: string;
  word: string; // only visible to drawer or server
  maskedWord: string;
  category: string;
  round: number;
  totalRounds: number;
  timeLeft: number;
  roundDuration: number;
  status: 'waiting' | 'drawing' | 'round_end' | 'game_over';
  guessedUserIds: string[];
  scores: Record<string, number>;
}

export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TriviaState {
  gameType: 'trivia';
  round: number;
  totalRounds: number;
  question: {
    id: string;
    category: string;
    question: string;
    options: string[];
  } | null;
  timeLeft: number;
  status: 'question' | 'reveal' | 'game_over';
  correctIndex?: number;
  explanation?: string;
  userAnswers: Record<string, number>; // userId -> chosen option
  scores: Record<string, number>;
  lastRoundPoints?: Record<string, number>;
}

export interface WordScrambleState {
  gameType: 'word_scramble';
  category: string;
  scrambledWord: string;
  hint: string;
  wordLength: number;
  timeLeft: number;
  round: number;
  totalRounds: number;
  status: 'playing' | 'round_end' | 'game_over';
  solvedBy?: { id: string; name: string } | null;
  revealedWord?: string;
  scores: Record<string, number>;
}

export interface ConnectFourState {
  gameType: 'connect_four';
  board: (string | null)[][]; // 6 rows x 7 columns. values: 'p1' | 'p2' | null
  p1Id: string | null;
  p1Name: string | null;
  p2Id: string | null;
  p2Name: string | null;
  currentTurn: 'p1' | 'p2';
  winner: 'p1' | 'p2' | 'draw' | null;
  winningLine: [number, number][] | null;
}

export type ActiveGameState =
  | DrawAndGuessState
  | TriviaState
  | WordScrambleState
  | ConnectFourState;

export interface RoomInfo {
  roomId: string;
  roomName: string;
  userCount: number;
  activeGameType?: GameType | null;
  hasPassword?: boolean;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  users: User[];
  activeGame: ActiveGameState | null;
  recentMessages: ChatMessage[];
  canvasStrokes: DrawStroke[];
  hasPassword?: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number;
}
