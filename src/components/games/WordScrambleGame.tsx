import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Send,
  Trophy,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { WordScrambleState, User } from '../../types';
import { triggerConfetti } from '../../utils/mediaUtils';

interface WordScrambleGameProps {
  gameState: WordScrambleState;
  currentUser: User | null;
  onSubmitGuess: (guess: string) => void;
}

export const WordScrambleGame: React.FC<WordScrambleGameProps> = ({
  gameState,
  currentUser,
  onSubmitGuess
}) => {
  const [guessInput, setGuessInput] = useState('');

  useEffect(() => {
    if (gameState.solvedBy && currentUser?.id === gameState.solvedBy.id) {
      triggerConfetti();
    }
  }, [gameState.solvedBy, currentUser]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || gameState.status !== 'playing') return;
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  const letters = gameState.scrambledWord.split('');

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold">Word Scramble</span>
              <span className="text-[10px] bg-violet-950/80 text-violet-300 border border-violet-800/70 px-2 py-0.5 rounded-full font-medium">
                {gameState.category}
              </span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock
            size={15}
            className={gameState.timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-violet-400'}
          />
          <span
            className={`font-mono font-bold text-sm ${
              gameState.timeLeft <= 5 ? 'text-red-400' : 'text-slate-200'
            }`}
          >
            {gameState.timeLeft}s
          </span>
        </div>
      </div>

      {/* Main Scramble Play Area */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Unscramble this word ({gameState.wordLength} letters)
        </span>

        {/* Big Scrambled Letter Tiles */}
        <div className="flex flex-wrap items-center justify-center gap-2 my-4">
          {letters.map((letter, idx) => (
            <div
              key={idx}
              className="w-11 h-13 sm:w-13 sm:h-16 rounded-xl bg-gradient-to-b from-violet-600 to-indigo-700 text-white font-display font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-violet-900/40 border border-violet-400/40 transform hover:-translate-y-1 transition-transform"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Clue/Hint */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300 max-w-md mx-auto my-2">
          <Lightbulb size={16} className="text-amber-400 flex-shrink-0" />
          <span>
            <strong>Hint:</strong> {gameState.hint}
          </span>
        </div>

        {/* Solved or End banner */}
        {gameState.status === 'round_end' && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs max-w-sm w-full animate-bounce">
            {gameState.solvedBy ? (
              <div>
                🎉 <strong>{gameState.solvedBy.name}</strong> solved it: "
                <span className="font-bold">{gameState.revealedWord}</span>"!
              </div>
            ) : (
              <div>
                Time's up! The word was: "
                <span className="font-bold">{gameState.revealedWord}</span>"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Guess Input */}
      <div className="p-3 bg-slate-900 border-t border-slate-800/80">
        <form onSubmit={handleGuessSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            disabled={gameState.status !== 'playing'}
            placeholder="Type your guess here or in room chat..."
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!guessInput.trim() || gameState.status !== 'playing'}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/20"
          >
            <Send size={14} />
            <span>Solve</span>
          </button>
        </form>
      </div>
    </div>
  );
};
