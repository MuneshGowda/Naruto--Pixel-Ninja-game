import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { ControlsGuide } from './components/ControlsGuide';
import { CHARACTERS, STAGES } from './data/characters';
import { audioManager } from './engine/Audio';

export default function App() {
  const [stage, setStage] = useState(STAGES[0]);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' (1P vs CPU) | 'pvp' (2P Local)
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard' | 'nightmare'
  const [p1Stats, setP1Stats] = useState({ hp: 100, cp: 40 });
  const [p2Stats, setP2Stats] = useState({ hp: 100, cp: 40 });
  const [timer, setTimer] = useState(99);
  const [winner, setWinner] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showDebugBoxes, setShowDebugBoxes] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef(null);

  // Throttled HUD update callback from GameEngine loop
  const handleHudUpdate = useCallback((data) => {
    setP1Stats((prev) => {
      if (Math.abs(prev.hp - data.p1Hp) > 0.1 || Math.abs(prev.cp - data.p1Cp) > 0.5) {
        return { hp: data.p1Hp, cp: data.p1Cp };
      }
      return prev;
    });

    setP2Stats((prev) => {
      if (Math.abs(prev.hp - data.p2Hp) > 0.1 || Math.abs(prev.cp - data.p2Cp) > 0.5) {
        return { hp: data.p2Hp, cp: data.p2Cp };
      }
      return prev;
    });

    setTimer((prev) => {
      if (prev !== data.timer) return data.timer;
      return prev;
    });
  }, []);

  const handleGameOver = useCallback((matchWinner) => {
    setWinner(matchWinner);
    setShowGameOver(true);
  }, []);

  const handleRestart = useCallback(() => {
    setShowGameOver(false);
    setWinner(null);
    setTimer(99);
    setP1Stats({ hp: 100, cp: 40 });
    setP2Stats({ hp: 100, cp: 40 });
    if (canvasRef.current) {
      canvasRef.current.restartMatch();
    }
  }, []);

  const handleSelectMode = (newMode) => {
    setGameMode(newMode);
    setShowGameOver(false);
    setWinner(null);
    setTimer(99);
    setP1Stats({ hp: 100, cp: 40 });
    setP2Stats({ hp: 100, cp: 40 });
    if (canvasRef.current) {
      canvasRef.current.setGameMode(newMode, difficulty);
      canvasRef.current.restartMatch();
    }
  };

  const handleSelectDifficulty = (newDiff) => {
    setDifficulty(newDiff);
    if (canvasRef.current) {
      canvasRef.current.setGameMode(gameMode, newDiff);
    }
  };

  const handleToggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleDebug = () => {
    if (canvasRef.current) {
      const newState = canvasRef.current.toggleHitboxes();
      setShowDebugBoxes(newState);
    }
  };

  const handleSwitchStage = () => {
    const nextIdx = (STAGES.findIndex((s) => s.id === stage.id) + 1) % STAGES.length;
    setStage(STAGES[nextIdx]);
    handleRestart();
  };

  return (
    <div className="game-app-container">
      {/* Background ambient decorative glow */}
      <div className="ambient-background-glow" />

      {/* Main Arcade Frame */}
      <main className="arcade-cabinet">
        {/* HUD Overlay with AI & Mode Selectors */}
        <HUD
          p1={CHARACTERS.naruto}
          p2={CHARACTERS.sasuke}
          p1Stats={p1Stats}
          p2Stats={p2Stats}
          timer={timer}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          showDebugBoxes={showDebugBoxes}
          onToggleDebug={handleToggleDebug}
          onRestart={handleRestart}
          stage={stage}
          onSelectStage={(newStg) => {
            setStage(newStg);
            handleRestart();
          }}
          stages={STAGES}
          gameMode={gameMode}
          onSelectMode={handleSelectMode}
          difficulty={difficulty}
          onSelectDifficulty={handleSelectDifficulty}
        />

        {/* 60 FPS HTML5 Canvas Battle Arena */}
        <Canvas
          ref={canvasRef}
          stage={stage}
          gameMode={gameMode}
          difficulty={difficulty}
          onHudUpdate={handleHudUpdate}
          onGameOver={handleGameOver}
          onToggleDebugState={setShowDebugBoxes}
        />

        {/* Bottom Ninja Controls Guide / AI Dossier */}
        <ControlsGuide
          gameMode={gameMode}
          difficulty={difficulty}
          onToggleMode={handleSelectMode}
        />
      </main>

      {/* Game Over Victory / Defeat Modal */}
      {showGameOver && (
        <GameOverModal
          winner={winner}
          onRestart={handleRestart}
          onSwitchStage={handleSwitchStage}
          currentStage={stage}
          gameMode={gameMode}
          difficulty={difficulty}
        />
      )}
    </div>
  );
}
