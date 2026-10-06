import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Swords, Compass, Skull, Bot } from 'lucide-react';
import { AI_DIFFICULTIES } from '../engine/AIController';

export function GameOverModal({ winner, onRestart, onSwitchStage, currentStage, gameMode = 'ai', difficulty = 'medium' }) {
  const isDraw = winner === 'draw' || !winner;
  const winnerData = !isDraw ? winner.config : null;
  const isP1Winner = winnerData?.id === 'naruto';
  const diffInfo = AI_DIFFICULTIES[difficulty] || AI_DIFFICULTIES.medium;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  let subtitleText = '';
  if (isDraw) {
    subtitleText = 'Both Shinobi fought with equal determination! A rare ninja stalemate.';
  } else if (gameMode === 'ai') {
    if (isP1Winner) {
      subtitleText = `Glorious Victory! You overcame the ${diffInfo.name} AI opponent with sheer ninja grit!`;
    } else {
      subtitleText = `Defeated by the ${diffInfo.name} AI! Sharpen your reflexes and challenge again!`;
    }
  } else {
    subtitleText = `Flawless execution! The power of ${winnerData.name.split(' ')[0]} prevails!`;
  }

  return (
    <div className="modal-backdrop">
      <div className="game-over-card">
        {/* Header / Banner */}
        <div className="game-over-banner">
          <div className="trophy-icon-wrapper">
            {isDraw ? (
              <Swords size={36} className="trophy-svg" />
            ) : gameMode === 'ai' && !isP1Winner ? (
              <Skull size={36} className="trophy-svg defeat-svg" />
            ) : (
              <Trophy size={36} className="trophy-svg" />
            )}
          </div>
          <h2 className="victory-title">
            {isDraw
              ? 'DRAW GAME'
              : gameMode === 'ai' && !isP1Winner
              ? 'DEFEATED BY CPU'
              : `${winnerData.name.toUpperCase()} WINS!`}
          </h2>
          <p className="victory-subtitle">{subtitleText}</p>
        </div>

        {/* Winner Showcase */}
        {!isDraw && winnerData && (
          <div className="winner-showcase">
            <div className="winner-portrait-frame">
              <img
                src={winnerData.avatar}
                alt={winnerData.name}
                className="winner-portrait-img"
              />
              <div className="winner-glow-ring" />
            </div>
            <div className="winner-details">
              <span className="winner-tag">
                {gameMode === 'ai' && !isP1Winner ? `CPU (${diffInfo.name.toUpperCase()})` : 'CHAMPION'}
              </span>
              <h3 className="winner-name">{winnerData.name}</h3>
              <p className="winner-quote">
                {winnerData.id === 'naruto'
                  ? `"I'm not gonna run away, I never go back on my word! That's my ninja way!"`
                  : `"My eyes can see right through your technique. You were outmatched from the start."`}
              </p>
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="modal-actions-row">
          <button onClick={onRestart} className="btn-primary rematch-btn">
            <RotateCcw size={20} />
            <span>REMATCH (ENTER)</span>
          </button>
          <button onClick={onSwitchStage} className="btn-secondary">
            <Compass size={20} />
            <span>CHANGE STAGE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
