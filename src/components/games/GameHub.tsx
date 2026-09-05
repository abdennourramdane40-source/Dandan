import React, { useState } from 'react';
import {
  Palette,
  BrainCircuit,
  Sparkles,
  Gamepad2,
  Trophy,
  X,
  Play,
  RotateCcw,
  Flame,
  Award
} from 'lucide-react';
import {
  ActiveGameState,
  DrawStroke,
  GameType,
  User
} from '../../types';
import { DrawAndGuessGame } from './DrawAndGuessGame';
import { TriviaGame } from './TriviaGame';
import { WordScrambleGame } from './WordScrambleGame';
import { ConnectFourGame } from './ConnectFourGame';

interface GameHubProps {
  activeGame: ActiveGameState | null;
  currentUser: User | null;
  users: User[];
  canvasStrokes: DrawStroke[];
  onStartGame: (gameType: GameType) => void;
  onEndGame: () => void;
  onSendStroke: (stroke: DrawStroke) => void;
  onClearCanvas: () => void;
  onSubmitGuess: (guess: string) => void;
  onSubmitTriviaAnswer: (answerIndex: number) => void;
  onDropConnectFourToken: (column: number) => void;
  onJoinConnectFour: (slot: 1 | 2) => void;
}

export const GameHub: React.FC<GameHubProps> = ({
  activeGame,
  currentUser,
  users,
  canvasStrokes,
  onStartGame,
  onEndGame,
  onSendStroke,
  onClearCanvas,
  onSubmitGuess,
  onSubmitTriviaAnswer,
  onDropConnectFourToken,
  onJoinConnectFour
}) => {
  const [showScoreboardModal, setShowScoreboardModal] = useState(false);

  const gameOptions = [
    {
      type: 'draw_and_guess' as GameType,
      title: 'Draw & Guess',
      icon: Palette,
      badge: 'Party Hit',
      color: 'from-amber-500 to-orange-600',
      description: 'One draws secret words on the live canvas, everyone races to guess!'
    },
    {
      type: 'trivia' as GameType,
      title: 'Trivia Blitz',
      icon: BrainCircuit,
      badge: 'Fast Paced',
      color: 'from-indigo-500 to-violet-600',
      description: '12-second live showdown with pop culture, science, gaming & movies.'
    },
    {
      type: 'word_scramble' as GameType,
      title: 'Word Scramble',
      icon: Sparkles,
      badge: 'Word Puzzle',
      color: 'from-purple-500 to-pink-600',
      description: 'Unscramble mixed-up letters with thematic hints before time expires!'
    },
    {
      type: 'connect_four' as GameType,
      title: 'Connect 4 Duel',
      icon: Gamepad2,
      badge: '2-Player',
      color: 'from-blue-500 to-cyan-600',
      description: 'Classic vertical strategy duel with room spectator live reactions.'
    }
  ];

  // Leaderboard of users sorted by score
  const sortedUsers = [...users].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="flex flex-col h-full relative">
      {/* Active Game Top Bar if game is active */}
      {activeGame && (
        <div className="mb-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              {activeGame.gameType === 'draw_and_guess'
                ? 'Draw & Guess'
                : activeGame.gameType === 'trivia'
                ? 'Trivia Blitz'
                : activeGame.gameType === 'word_scramble'
                ? 'Word Scramble'
                : 'Connect 4'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScoreboardModal(true)}
              className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded-lg transition-colors"
            >
              <Trophy size={13} />
              <span>Scores</span>
            </button>
            <button
              onClick={onEndGame}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-300 hover:bg-red-950/50 px-2 py-1 rounded-lg border border-slate-700/60 transition-colors"
            >
              <X size={13} />
              <span>Leave Game</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 min-h-0">
        {activeGame ? (
          <>
            {activeGame.gameType === 'draw_and_guess' && (
              <DrawAndGuessGame
                gameState={activeGame}
                currentUser={currentUser}
                canvasStrokes={canvasStrokes}
                onSendStroke={onSendStroke}
                onClearCanvas={onClearCanvas}
                onSubmitGuess={onSubmitGuess}
              />
            )}
            {activeGame.gameType === 'trivia' && (
              <TriviaGame
                gameState={activeGame}
                currentUser={currentUser}
                users={users}
                onSubmitAnswer={onSubmitTriviaAnswer}
              />
            )}
            {activeGame.gameType === 'word_scramble' && (
              <WordScrambleGame
                gameState={activeGame}
                currentUser={currentUser}
                onSubmitGuess={onSubmitGuess}
              />
            )}
            {activeGame.gameType === 'connect_four' && (
              <ConnectFourGame
                gameState={activeGame}
                currentUser={currentUser}
                onDropToken={onDropConnectFourToken}
                onJoinAsPlayer={onJoinConnectFour}
                onRestart={() => onStartGame('connect_four')}
              />
            )}
          </>
        ) : (
          /* Game Selection Lounge */
          <div className="h-full bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Gamepad2 className="text-indigo-400" size={22} />
                    Party Games Lounge
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pick a game to play together with everyone in this room!
                  </p>
                </div>

                <button
                  onClick={() => setShowScoreboardModal(true)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Trophy size={14} />
                  <span>Leaderboard</span>
                </button>
              </div>

              {/* Game Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gameOptions.map((g) => {
                  const Icon = g.icon;
                  return (
                    <div
                      key={g.type}
                      className="group relative bg-slate-950/70 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${g.color} flex items-center justify-center text-white shadow-md`}
                          >
                            <Icon size={20} />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded-full">
                            {g.badge}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {g.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {g.description}
                        </p>
                      </div>

                      <button
                        onClick={() => onStartGame(g.type)}
                        className="mt-4 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                      >
                        <Play size={13} className="fill-white" />
                        <span>Start Game</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Room Mini-Leaderboard */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Award size={14} className="text-amber-400" />
                  Room Top Scores
                </span>
                <span>{users.length} players</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedUsers.slice(0, 4).map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: u.avatarColor }}
                    />
                    <span className="text-slate-300 font-medium truncate max-w-[80px]">
                      {u.name}
                    </span>
                    <span className="text-amber-400 font-bold font-mono">
                      {u.score || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scoreboard Modal */}
      {showScoreboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" />
                <h3 className="font-display font-bold text-base text-slate-100">
                  Hangout Leaderboard
                </h3>
              </div>
              <button
                onClick={() => setShowScoreboardModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : idx === 2
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">
                      {u.name} {u.id === currentUser?.id ? '(You)' : ''}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">
                    {u.score || 0} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
