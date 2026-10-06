import React from 'react';
import { Volume2, VolumeX, Eye, RotateCcw, Sparkles, Zap, Bot, Users, Shield } from 'lucide-react';
import { AI_DIFFICULTIES } from '../engine/AIController';

export function HUD({
  p1,
  p2,
  p1Stats,
  p2Stats,
  timer,
  isMuted,
  onToggleMute,
  showDebugBoxes,
  onToggleDebug,
  onRestart,
  stage,
  onSelectStage,
  stages,
  gameMode = 'ai',
  onSelectMode,
  difficulty = 'medium',
  onSelectDifficulty
}) {
  const p1HpPercent = Math.max(0, Math.min(100, (p1Stats.hp / p1.maxHp) * 100));
  const p1CpPercent = Math.max(0, Math.min(100, (p1Stats.cp / p1.maxCp) * 100));

  const p2HpPercent = Math.max(0, Math.min(100, (p2Stats.hp / p2.maxHp) * 100));
  const p2CpPercent = Math.max(0, Math.min(100, (p2Stats.cp / p2.maxCp) * 100));

  const p1JutsuReady = p1Stats.cp >= (p1.attacks?.special?.cpCost || 30);
  const p2JutsuReady = p2Stats.cp >= (p2.attacks?.special?.cpCost || 30);

  const diffConfig = AI_DIFFICULTIES[difficulty] || AI_DIFFICULTIES.medium;

  return (
    <header className="hud-container">
      {/* Top Utility Controls Bar */}
      <div className="hud-top-bar">
        {/* Mode Selector */}
        <div className="mode-selector-group">
          <button
            onClick={() => onSelectMode('ai')}
            className={`mode-btn ${gameMode === 'ai' ? 'active' : ''}`}
            title="Single Player vs AI Opponent"
          >
            <Bot size={15} />
            <span>VS AI (1P)</span>
          </button>
          <button
            onClick={() => onSelectMode('pvp')}
            className={`mode-btn ${gameMode === 'pvp' ? 'active' : ''}`}
            title="2 Player Local Keyboard Battle"
          >
            <Users size={15} />
            <span>LOCAL (2P)</span>
          </button>
        </div>

        {/* AI Difficulty Selector (Visible when in AI mode) */}
        {gameMode === 'ai' && (
          <div className="difficulty-selector-group">
            <span className="diff-label">AI RANK:</span>
            {Object.entries(AI_DIFFICULTIES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => onSelectDifficulty(key)}
                className={`diff-btn ${difficulty === key ? 'active' : ''}`}
                style={{
                  '--accent-color': val.badgeColor
                }}
                title={`Reaction: ${val.reactionFrames} frames, Block: ${Math.round(val.blockChance * 100)}%`}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Stage Selector */}
        <div className="stage-selector">
          <span className="stage-label">STAGE:</span>
          {stages.map((stg) => (
            <button
              key={stg.id}
              onClick={() => onSelectStage(stg)}
              className={`stage-btn ${stage.id === stg.id ? 'active' : ''}`}
            >
              {stg.name}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hud-actions">
          <button
            onClick={onToggleDebug}
            className={`hud-icon-btn ${showDebugBoxes ? 'active' : ''}`}
            title="Toggle Hitboxes / Hurtboxes (Key: B)"
          >
            <Eye size={16} />
            <span>HITBOXES {showDebugBoxes ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={onToggleMute}
            className="hud-icon-btn"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={onRestart}
            className="hud-icon-btn"
            title="Restart Match (Esc)"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Main Arcade Battle Bars */}
      <div className="hud-bars-row">
        {/* PLAYER 1 (Left Side: Naruto) */}
        <div className="player-hud p1-hud">
          <div className="avatar-wrapper p1-avatar">
            <img src={p1.avatar} alt={p1.name} className="avatar-img" />
            <div className="player-tag">P1</div>
          </div>

          <div className="bars-content p1-bars">
            <div className="character-name-row">
              <span className="character-name">{p1.name}</span>
              {p1JutsuReady && (
                <span className="jutsu-badge rasengan-badge">
                  <Sparkles size={12} /> RASENGAN READY [G]
                </span>
              )}
            </div>

            {/* Health Bar */}
            <div className="bar-track hp-track">
              <div
                className="bar-fill hp-fill p1-hp"
                style={{ width: `${p1HpPercent}%` }}
              >
                <div className="bar-glare" />
              </div>
              <span className="bar-number">{Math.round(p1Stats.hp)} HP</span>
            </div>

            {/* Chakra Bar */}
            <div className="bar-track cp-track">
              <div
                className="bar-fill cp-fill p1-cp"
                style={{ width: `${p1CpPercent}%` }}
              />
              <span className="bar-number cp-num">CHAKRA {Math.round(p1Stats.cp)}%</span>
            </div>
          </div>
        </div>

        {/* CENTER TIMER */}
        <div className="timer-wrapper">
          <div className="timer-box">
            <span className={`timer-digits ${timer <= 15 ? 'timer-danger' : ''}`}>
              {timer.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="timer-sub">TIME</div>
        </div>

        {/* PLAYER 2 / CPU (Right Side: Sasuke - Mirrored) */}
        <div className="player-hud p2-hud">
          <div className="bars-content p2-bars">
            <div className="character-name-row right-align">
              {p2JutsuReady && (
                <span className="jutsu-badge chidori-badge">
                  <Zap size={12} /> CHIDORI READY {gameMode === 'ai' ? '[AUTO]' : '[L]'}
                </span>
              )}
              {gameMode === 'ai' && (
                <span
                  className="ai-rank-badge"
                  style={{ borderColor: diffConfig.badgeColor, color: diffConfig.badgeColor }}
                >
                  <Bot size={11} /> {diffConfig.name.toUpperCase()}
                </span>
              )}
              <span className="character-name">
                {p2.name}
              </span>
            </div>

            {/* Health Bar */}
            <div className="bar-track hp-track reversed">
              <div
                className="bar-fill hp-fill p2-hp"
                style={{ width: `${p2HpPercent}%` }}
              >
                <div className="bar-glare" />
              </div>
              <span className="bar-number">{Math.round(p2Stats.hp)} HP</span>
            </div>

            {/* Chakra Bar */}
            <div className="bar-track cp-track reversed">
              <div
                className="bar-fill cp-fill p2-cp"
                style={{ width: `${p2CpPercent}%` }}
              />
              <span className="bar-number cp-num">CHAKRA {Math.round(p2Stats.cp)}%</span>
            </div>
          </div>

          <div className={`avatar-wrapper ${gameMode === 'ai' ? 'cpu-avatar' : 'p2-avatar'}`}>
            <img src={p2.avatar} alt={p2.name} className="avatar-img" />
            <div className={`player-tag ${gameMode === 'ai' ? 'cpu-tag' : 'p2-tag'}`}>
              {gameMode === 'ai' ? 'CPU' : 'P2'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
