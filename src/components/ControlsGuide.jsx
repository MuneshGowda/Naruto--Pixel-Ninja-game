import React from 'react';
import { Gamepad2, Flame, Zap, Shield, Sparkles, Bot, Users, Award, ShieldAlert } from 'lucide-react';
import { AI_DIFFICULTIES } from '../engine/AIController';

export function ControlsGuide({ gameMode = 'ai', difficulty = 'medium', onToggleMode }) {
  const diffData = AI_DIFFICULTIES[difficulty] || AI_DIFFICULTIES.medium;

  return (
    <footer className="controls-guide-container">
      <div className="controls-grid">
        {/* PLAYER 1 CONTROLS */}
        <div className="player-controls-card p1-card">
          <div className="card-header p1-header">
            <span className="p1-badge">P1</span>
            <span className="header-title">NARUTO (PLAYER 1)</span>
          </div>
          <div className="keys-list">
            <div className="key-row">
              <span className="action-name">Move / Jump / Crouch</span>
              <div className="keys-group">
                <kbd className="key-cap">W</kbd>
                <kbd className="key-cap">A</kbd>
                <kbd className="key-cap">S</kbd>
                <kbd className="key-cap">D</kbd>
              </div>
            </div>
            <div className="key-row">
              <span className="action-name">Light Strike</span>
              <kbd className="key-cap highlight-key">F</kbd>
            </div>
            <div className="key-row">
              <span className="action-name special-jutsu-name">
                <Sparkles size={13} /> Rasengan (30+ CP)
              </span>
              <kbd className="key-cap rasengan-key">G</kbd>
            </div>
            <div className="key-row">
              <span className="action-name">
                <Flame size={13} /> Charge Chakra
              </span>
              <kbd className="key-cap charge-key">H (Hold)</kbd>
            </div>
            <div className="key-row">
              <span className="action-name">
                <Shield size={13} /> Guard Barrier
              </span>
              <span className="guard-desc">Hold Away or Crouch [S]</span>
            </div>
          </div>
        </div>

        {/* COMBAT SYSTEM TIPS */}
        <div className="system-tips-card">
          <div className="card-header center-header">
            <Gamepad2 size={16} />
            <span className="header-title">NINJA COMBAT MECHANICS</span>
          </div>
          <ul className="tips-list">
            <li>
              <strong>Guard & Defense:</strong> Moving away while the opponent attacks or holding <kbd className="key-cap inline-key">S</kbd> activates your chakra guard, absorbing 80% of damage!
            </li>
            <li>
              <strong>Chakra Recharge:</strong> Hold your charge key (<kbd className="key-cap inline-key">H</kbd>) to rapidly channel chakra for high-impact special moves.
            </li>
            <li>
              <strong>Hitbox & Hurtbox:</strong> Press <kbd className="key-cap inline-key">B</kbd> anytime to reveal collision boundaries (Red Hitbox, Green Hurtbox).
            </li>
          </ul>
        </div>

        {/* PLAYER 2 / AI OPPONENT DOSSIER */}
        {gameMode === 'ai' ? (
          <div className="player-controls-card ai-card">
            <div className="card-header ai-header">
              <span className="cpu-badge">CPU</span>
              <span className="header-title">SASUKE (AI OPPONENT)</span>
              <span
                className="ai-diff-indicator"
                style={{ backgroundColor: diffData.badgeColor }}
              >
                {diffData.name}
              </span>
            </div>
            <div className="ai-dossier-content">
              <div className="ai-stat-row">
                <span className="ai-stat-label">Reaction Window:</span>
                <span className="ai-stat-value">{diffData.reactionFrames} frames (~{Math.round((diffData.reactionFrames / 60) * 1000)}ms)</span>
              </div>
              <div className="ai-stat-row">
                <span className="ai-stat-label">Guard Frequency:</span>
                <span className="ai-stat-value">{Math.round(diffData.blockChance * 100)}% dynamic defense</span>
              </div>
              <div className="ai-stat-row">
                <span className="ai-stat-label">Chidori Aggression:</span>
                <span className="ai-stat-value">{Math.round(diffData.specialAggression * 100)}% when ready</span>
              </div>
              <div className="ai-tactics-tip">
                <strong>Tactical Tip:</strong> {
                  difficulty === 'easy'
                    ? 'Genin AI is passive with delayed reactions. Rush in with combos and test your Rasengan.'
                    : difficulty === 'medium'
                    ? 'Chunin AI defends and attacks when in range. Bait out its strikes and punish on recovery.'
                    : difficulty === 'hard'
                    ? 'Jonin AI blocks heavily and counters whiffed attacks. Use mixups and charge chakra safely.'
                    : 'Nightmare Kage AI possesses near frame-perfect guards and relentless aggression. Perfect spacing required!'
                }
              </div>
              <button onClick={() => onToggleMode('pvp')} className="switch-mode-btn">
                <Users size={13} />
                <span>Switch to 2-Player Local Mode</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="player-controls-card p2-card">
            <div className="card-header p2-header">
              <span className="p2-badge">P2</span>
              <span className="header-title">SASUKE (PLAYER 2 LOCAL)</span>
            </div>
            <div className="keys-list">
              <div className="key-row">
                <span className="action-name">Move / Jump / Crouch</span>
                <div className="keys-group">
                  <kbd className="key-cap">↑</kbd>
                  <kbd className="key-cap">←</kbd>
                  <kbd className="key-cap">↓</kbd>
                  <kbd className="key-cap">→</kbd>
                </div>
              </div>
              <div className="key-row">
                <span className="action-name">Light Strike</span>
                <div className="keys-group">
                  <kbd className="key-cap highlight-key">K</kbd>
                  <span className="key-or">or</span>
                  <kbd className="key-cap highlight-key">Num 1</kbd>
                </div>
              </div>
              <div className="key-row">
                <span className="action-name special-jutsu-name">
                  <Zap size={13} /> Chidori (30+ CP)
                </span>
                <div className="keys-group">
                  <kbd className="key-cap chidori-key">L</kbd>
                  <span className="key-or">or</span>
                  <kbd className="key-cap chidori-key">Num 2</kbd>
                </div>
              </div>
              <div className="key-row">
                <span className="action-name">
                  <Flame size={13} /> Charge Chakra
                </span>
                <div className="keys-group">
                  <kbd className="key-cap charge-key">; (Hold)</kbd>
                  <span className="key-or">or</span>
                  <kbd className="key-cap charge-key">Num 3</kbd>
                </div>
              </div>
              <button onClick={() => onToggleMode('ai')} className="switch-mode-btn">
                <Bot size={13} />
                <span>Switch to 1-Player (Vs AI) Mode</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
