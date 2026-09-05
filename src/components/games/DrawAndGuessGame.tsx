import React, { useRef, useEffect, useState } from 'react';
import {
  Palette,
  Eraser,
  Trash2,
  Clock,
  Trophy,
  Sparkles,
  Send,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { DrawAndGuessState, DrawStroke, User } from '../../types';
import { triggerConfetti } from '../../utils/mediaUtils';

interface DrawAndGuessGameProps {
  gameState: DrawAndGuessState;
  currentUser: User | null;
  canvasStrokes: DrawStroke[];
  onSendStroke: (stroke: DrawStroke) => void;
  onClearCanvas: () => void;
  onSubmitGuess: (guess: string) => void;
}

const COLORS = [
  '#000000',
  '#ffffff',
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#a855f7'  // violet
];

export const DrawAndGuessGame: React.FC<DrawAndGuessGameProps> = ({
  gameState,
  currentUser,
  canvasStrokes,
  onSendStroke,
  onClearCanvas,
  onSubmitGuess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [guessInput, setGuessInput] = useState('');

  const isDrawer = currentUser?.id === gameState.drawerId;
  const hasGuessed = currentUser && gameState.guessedUserIds.includes(currentUser.id);

  // Redraw canvas whenever canvasStrokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw all strokes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    canvasStrokes.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.moveTo(stroke.x0 * canvas.width, stroke.y0 * canvas.height);
      ctx.lineTo(stroke.x1 * canvas.width, stroke.y1 * canvas.height);
      ctx.stroke();
    });
  }, [canvasStrokes]);

  // Confetti on correct guess
  useEffect(() => {
    if (hasGuessed) {
      triggerConfetti();
    }
  }, [hasGuessed]);

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || gameState.status !== 'drawing') return;
    const canvas = canvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);

    isDrawingRef.current = true;
    lastPointRef.current = getCanvasCoordinates(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isDrawer || gameState.status !== 'drawing') return;
    const currentPoint = getCanvasCoordinates(e);
    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      const stroke: DrawStroke = {
        x0: lastPoint.x,
        y0: lastPoint.y,
        x1: currentPoint.x,
        y1: currentPoint.y,
        color: currentColor,
        size: brushSize
      };

      // Draw locally immediately for responsiveness
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(stroke.x0 * canvas.width, stroke.y0 * canvas.height);
          ctx.lineTo(stroke.x1 * canvas.width, stroke.y1 * canvas.height);
          ctx.stroke();
        }
      }

      onSendStroke(stroke);
      lastPointRef.current = currentPoint;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isDrawer || hasGuessed) return;
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Game Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Drawer & Category */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Palette size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">
                {isDrawer ? 'You are drawing!' : `${gameState.drawerName} is drawing`}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {gameState.category}
              </span>
            </div>

            {/* Word reveal or masked word */}
            <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-amber-300">
              {isDrawer ? (
                <span>Word: {gameState.word}</span>
              ) : (
                <span>{gameState.maskedWord}</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock
            size={16}
            className={gameState.timeLeft <= 10 ? 'text-red-400 animate-spin' : 'text-amber-400'}
          />
          <span
            className={`font-mono font-bold text-sm ${
              gameState.timeLeft <= 10 ? 'text-red-400' : 'text-slate-200'
            }`}
          >
            {gameState.timeLeft}s
          </span>
        </div>

        {/* Right: Solved status */}
        <div className="flex items-center gap-1.5 text-xs">
          {hasGuessed ? (
            <div className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-lg font-medium">
              <CheckCircle2 size={14} />
              <span>You Guessed It!</span>
            </div>
          ) : (
            <span className="text-slate-400">
              {gameState.guessedUserIds.length} guessed
            </span>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-2 min-h-[280px]">
        <div className="relative w-full h-full max-w-2xl aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full h-full touch-none ${
              isDrawer ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />

          {/* Round end banner */}
          {gameState.status === 'round_end' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">
                Round Finished
              </span>
              <h3 className="font-display text-2xl font-bold text-white mb-2">
                The word was: <span className="text-amber-300">{gameState.word}</span>
              </h3>
              <p className="text-xs text-slate-400">Next round starting soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls: Drawer Tools OR Guesser Input */}
      <div className="p-3 bg-slate-900 border-t border-slate-800/80">
        {isDrawer ? (
          /* Drawer Palette & Tools */
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Colors */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrentColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    currentColor === c
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Sizes & Clear */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 mr-1">Size:</span>
                {[2, 4, 8, 16].map((s) => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      brushSize === s
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={onClearCanvas}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-medium transition-colors"
                title="Clear the canvas"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        ) : (
          /* Guesser Input */
          <form onSubmit={handleGuessSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              disabled={hasGuessed || gameState.status !== 'drawing'}
              placeholder={
                hasGuessed
                  ? 'You already guessed correctly! Sit back and watch 🎉'
                  : 'Type your guess here (or in room chat)...'
              }
              className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!guessInput.trim() || hasGuessed || gameState.status !== 'drawing'}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/20"
            >
              <Send size={14} />
              <span>Guess</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
