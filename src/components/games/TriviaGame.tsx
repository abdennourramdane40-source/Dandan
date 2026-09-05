import React, { useEffect } from 'react';
import {
  BrainCircuit,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  Award
} from 'lucide-react';
import { TriviaState, User } from '../../types';
import { triggerConfetti, triggerWinConfetti } from '../../utils/mediaUtils';

interface TriviaGameProps {
  gameState: TriviaState;
  currentUser: User | null;
  users: User[];
  onSubmitAnswer: (answerIndex: number) => void;
}

export const TriviaGame: React.FC<TriviaGameProps> = ({
  gameState,
  currentUser,
  users,
  onSubmitAnswer
}) => {
  const isQuestionState = gameState.status === 'question';
  const isRevealState = gameState.status === 'reveal';
  const isGameOver = gameState.status === 'game_over';

  const myAnswer = currentUser ? gameState.userAnswers[currentUser.id] : undefined;
  const hasAnswered = myAnswer !== undefined;

  // Confetti on win
  useEffect(() => {
    if (isGameOver) {
      triggerWinConfetti();
    } else if (
      isRevealState &&
      myAnswer !== undefined &&
      myAnswer === gameState.correctIndex
    ) {
      triggerConfetti();
    }
  }, [isGameOver, isRevealState, myAnswer, gameState.correctIndex]);

  // Sort users by score for leaderboard
  const leaderboard = [...users].sort(
    (a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0)
  );

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-full bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
          <Trophy size={32} />
        </div>
        <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
          Trivia Tournament Completed
        </span>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          Final Standings
        </h2>

        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-3 divide-y divide-slate-800/60 mb-4">
          {leaderboard.map((user, idx) => (
            <div
              key={user.id}
              className="py-2 px-3 flex items-center justify-between text-sm"
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
                <span className="font-semibold text-slate-200">{user.name}</span>
              </div>
              <span className="font-mono font-bold text-amber-300">
                {gameState.scores[user.id] || 0} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentQ = gameState.question;
  if (!currentQ) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <BrainCircuit size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 px-2 py-0.5 rounded-full font-medium">
                {currentQ.category}
              </span>
            </div>
          </div>
        </div>

        {/* Timer */}
        {isQuestionState && (
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock
              size={15}
              className={gameState.timeLeft <= 4 ? 'text-red-400 animate-pulse' : 'text-indigo-400'}
            />
            <span
              className={`font-mono font-bold text-sm ${
                gameState.timeLeft <= 4 ? 'text-red-400' : 'text-slate-200'
              }`}
            >
              {gameState.timeLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center overflow-y-auto">
        <div className="mb-6 text-center max-w-xl mx-auto">
          <h3 className="font-display text-lg sm:text-xl font-bold text-slate-100 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto w-full">
          {currentQ.options.map((option, idx) => {
            const isSelected = myAnswer === idx;
            const isCorrect = isRevealState && gameState.correctIndex === idx;
            const isWrong =
              isRevealState && isSelected && gameState.correctIndex !== idx;

            let buttonStyle =
              'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-200';

            if (isSelected && isQuestionState) {
              buttonStyle =
                'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]';
            } else if (isCorrect) {
              buttonStyle =
                'bg-emerald-900/60 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-900/40';
            } else if (isWrong) {
              buttonStyle =
                'bg-red-950/60 border-red-500 text-red-200 opacity-80';
            } else if (isRevealState) {
              buttonStyle = 'bg-slate-800/40 border-slate-800 text-slate-400';
            }

            return (
              <button
                key={idx}
                disabled={!isQuestionState || hasAnswered}
                onClick={() => onSubmitAnswer(idx)}
                className={`p-3.5 sm:p-4 rounded-xl border text-left font-medium text-sm transition-all duration-200 flex items-center justify-between relative group ${buttonStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-300">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>

                {isCorrect && (
                  <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                )}
                {isWrong && (
                  <XCircle size={18} className="text-red-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Reveal Explanation Card */}
        {isRevealState && gameState.explanation && (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 max-w-xl mx-auto w-full text-center">
            <span className="text-xs font-semibold text-emerald-400 block mb-0.5">
              Did you know?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {gameState.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Live Answers Progress */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>
          {Object.keys(gameState.userAnswers).length} of {users.length} answered
        </span>
        {hasAnswered && isQuestionState && (
          <span className="text-indigo-400 font-semibold flex items-center gap-1">
            <CheckCircle2 size={13} />
            Answer locked in!
          </span>
        )}
      </div>
    </div>
  );
};
