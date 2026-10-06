import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Player } from '../engine/Player.js';
import { GameEngine } from '../engine/GameLoop.js';
import { CHARACTERS, DEFAULT_KEYBINDINGS } from '../data/characters.js';

export const Canvas = forwardRef(function Canvas(
  { stage, gameMode = 'ai', difficulty = 'medium', onHudUpdate, onGameOver, onToggleDebugState },
  ref
) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Initialize and run engine
  const startEngine = () => {
    if (!canvasRef.current) return;

    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const canvas = canvasRef.current;

    // Player 1: Naruto (Left side, facing right)
    const p1 = new Player(
      CHARACTERS.naruto,
      160,
      stage.groundY - 100,
      1,
      DEFAULT_KEYBINDINGS.p1
    );

    // Player 2: Sasuke (Right side, facing left)
    const p2 = new Player(
      CHARACTERS.sasuke,
      canvas.width - 240,
      stage.groundY - 100,
      -1,
      DEFAULT_KEYBINDINGS.p2
    );

    const engine = new GameEngine(
      canvas,
      p1,
      p2,
      stage,
      { mode: gameMode, difficulty },
      { onHudUpdate, onGameOver }
    );

    engineRef.current = engine;
    engine.start();
  };

  useEffect(() => {
    startEngine();

    // Global shortcut keys for game convenience
    const handleGlobalKeys = (e) => {
      if (e.code === 'KeyB') {
        if (engineRef.current) {
          const newState = engineRef.current.toggleHitboxes();
          if (onToggleDebugState) onToggleDebugState(newState);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeys);
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  // Update stage when user switches stage
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setStage(stage);
    }
  }, [stage]);

  // Update Game Mode or AI Difficulty dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setGameMode(gameMode, difficulty);
    }
  }, [gameMode, difficulty]);

  // Expose controls to parent component
  useImperativeHandle(ref, () => ({
    restartMatch: () => {
      startEngine();
    },
    toggleHitboxes: () => {
      if (engineRef.current) {
        return engineRef.current.toggleHitboxes();
      }
      return false;
    },
    setGameMode: (mode, diff) => {
      if (engineRef.current) {
        engineRef.current.setGameMode(mode, diff);
      }
    }
  }));

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={1000}
        height={560}
        className="game-canvas"
      />
    </div>
  );
});
