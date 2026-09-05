import React, { useEffect } from 'react';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { ConnectFourState, User } from '../../types';
import { triggerWinConfetti } from '../../utils/mediaUtils';

interface ConnectFourGameProps {
  gameState: ConnectFourState;
  currentUser: User | null;
  onDropToken: (column: number) => void;
  onJoinAsPlayer: (slot: 1 | 2) => void;
  onRestart: () => void;
}

export const ConnectFourGame: React.FC<ConnectFourGameProps> = ({
  gameState,
  currentUser,
  onDropToken,
  onJoinAsPlayer,
  onRestart
}) => {
  const isP1 = currentUser?.id === gameState.p1Id;
  const isP2 = currentUser?.id === gameState.p2Id;
  const isMyTurn =
    (gameState.currentTurn === 'p1' && isP1) ||
    (gameState.currentTurn === 'p2' && isP2);

  useEffect(() => {
    if (gameState.winner && gameState.winner !== 'draw') {
      triggerWinConfetti();
    }
  }, [gameState.winner]);

  const isWinningCell = (row: number, col: number) => {
    if (!gameState.winningLine) return false;
    return gameState.winningLine.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <Gamepad2 size={16} />
          </div>
          <div>
            <span className="text-xs text-slate-200 font-bold block">
              Connect 4 Party Duel
            </span>
            <span className="text-[10px] text-slate-400">
              4-in-a-row to win
            </span>
          </div>
        </div>

        {gameState.winner && (
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
          >
            <RotateCcw size={13} />
            <span>Rematch</span>
          </button>
        )}
      </div>

      {/* Players status banner */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-around text-xs">
        {/* P1 */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-red-400/50 shadow-sm" />
          {gameState.p1Name ? (
            <span className="font-semibold text-slate-200">
              {gameState.p1Name} {isP1 ? '(You)' : ''}
            </span>
          ) : (
            <button
              onClick={() => onJoinAsPlayer(1)}
              className="text-pink-400 hover:text-pink-300 font-semibold underline flex items-center gap-1"
            >
              <UserPlus size={12} />
              Join as P1 (Red)
            </button>
          )}
        </div>

        <span className="text-slate-500 font-bold">VS</span>

        {/* P2 */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-400 ring-2 ring-amber-300/50 shadow-sm" />
          {gameState.p2Name ? (
            <span className="font-semibold text-slate-200">
              {gameState.p2Name} {isP2 ? '(You)' : ''}
            </span>
          ) : (
            <button
              onClick={() => onJoinAsPlayer(2)}
              className="text-pink-400 hover:text-pink-300 font-semibold underline flex items-center gap-1"
            >
              <UserPlus size={12} />
              Join as P2 (Yellow)
            </button>
          )}
        </div>
      </div>

      {/* Board & Play Area */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col items-center justify-center overflow-y-auto">
        {/* Turn alert */}
        <div className="mb-2 text-center">
          {gameState.winner ? (
            <div className="text-sm font-bold text-pink-300 flex items-center gap-1.5 justify-center">
              <Trophy size={16} />
              <span>
                {gameState.winner === 'draw'
                  ? "It's a Draw!"
                  : `${gameState.winner === 'p1' ? gameState.p1Name : gameState.p2Name} Wins!`}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-300 font-medium">
              {isMyTurn ? (
                <span className="text-emerald-400 font-bold animate-pulse">
                  It's your turn! Click a column to drop token.
                </span>
              ) : (
                <span>
                  {gameState.currentTurn === 'p1' ? gameState.p1Name : gameState.p2Name}'s turn (
                  {gameState.currentTurn === 'p1' ? 'Red' : 'Yellow'})
                </span>
              )}
            </div>
          )}
        </div>

        {/* 7x6 Connect 4 Grid */}
        <div className="bg-blue-600 p-2 sm:p-3 rounded-2xl shadow-2xl border-4 border-blue-500 inline-block max-w-sm sm:max-w-md w-full">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: 7 }).map((_, col) => {
              const canDrop =
                !gameState.winner && isMyTurn && gameState.board[0][col] === null;

              return (
                <button
                  key={col}
                  disabled={!canDrop}
                  onClick={() => onDropToken(col)}
                  className={`flex flex-col gap-1.5 sm:gap-2 rounded-lg p-0.5 transition-colors ${
                    canDrop
                      ? 'hover:bg-blue-500/50 cursor-pointer'
                      : 'cursor-default'
                  }`}
                >
                  {Array.from({ length: 6 }).map((_, row) => {
                    const cell = gameState.board[row][col];
                    const isWin = isWinningCell(row, col);

                    return (
                      <div
                        key={row}
                        className={`w-full aspect-square rounded-full transition-all duration-300 flex items-center justify-center shadow-inner ${
                          cell === 'p1'
                            ? 'bg-red-500 border-2 border-red-300'
                            : cell === 'p2'
                            ? 'bg-amber-400 border-2 border-amber-200'
                            : 'bg-slate-900/90 border border-blue-700/50'
                        } ${
                          isWin
                            ? 'ring-4 ring-white animate-bounce scale-105 z-10'
                            : ''
                        }`}
                      >
                        {isWin && (
                          <Sparkles size={12} className="text-white" />
                        )}
                      </div>
                    );
                  })}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 text-center">
        {!isP1 && !isP2
          ? 'You are spectating the match.'
          : 'Room members are cheering in live chat.'}
      </div>
    </div>
  );
};
