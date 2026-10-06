import { Collision } from './Collision.js';
import { ParticleSystem } from './Particles.js';
import { audioManager } from './Audio.js';
import { AIController } from './AIController.js';

export class GameEngine {
  constructor(canvas, p1, p2, stage, options = {}, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.p1 = p1;
    this.p2 = p2;
    this.stage = stage;
    this.callbacks = callbacks; // { onHudUpdate, onGameOver }

    // Mode: 'ai' (Player vs AI) or 'pvp' (2 Player Local)
    this.mode = options.mode || 'ai';
    this.difficulty = options.difficulty || 'medium';
    this.aiController = new AIController(this.difficulty);

    this.particles = new ParticleSystem();
    this.particles.initAmbient(stage.atmosphere || 'storm', canvas.width, canvas.height);

    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = 0;

    // Game Match State
    this.matchTimer = 99;
    this.timerAcc = 0;
    this.matchState = 'intro'; // 'intro', 'fighting', 'gameover'
    this.introTimer = 90; // frames of "READY... FIGHT!"
    this.koTimer = 120; // delay after KO before showing modal
    this.winner = null;

    // Screen Shake
    this.screenShake = 0;

    // Debug Hitbox Toggle
    this.showDebugBoxes = false;

    // Preload stage background image
    this.bgImage = new Image();
    this.bgImage.src = stage.bg;
    this.bgLoaded = false;
    this.bgImage.onload = () => {
      this.bgLoaded = true;
    };

    // Keyboard inputs
    this.keys = {};
    this.setupListeners();
  }

  setupListeners() {
    this.handleKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.key) {
        this.keys[e.key] = true;
        this.keys[e.key.toLowerCase()] = true;
      }
      audioManager.init(); // Init AudioContext on first user interaction
    };
    this.handleKeyUp = (e) => {
      this.keys[e.code] = false;
      if (e.key) {
        this.keys[e.key] = false;
        this.keys[e.key.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    audioManager.stopChakraLoop();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    audioManager.playFightStart();
    this.loop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setStage(stage) {
    this.stage = stage;
    this.bgImage = new Image();
    this.bgImage.src = stage.bg;
    this.bgLoaded = false;
    this.bgImage.onload = () => {
      this.bgLoaded = true;
    };
    this.particles.initAmbient(stage.atmosphere || 'storm', this.canvas.width, this.canvas.height);
  }

  setGameMode(mode, difficulty) {
    if (mode) this.mode = mode;
    if (difficulty) {
      this.difficulty = difficulty;
      this.aiController.setDifficulty(difficulty);
    }
  }

  toggleHitboxes() {
    this.showDebugBoxes = !this.showDebugBoxes;
    return this.showDebugBoxes;
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    this.update();
    this.render();

    this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
  }

  update() {
    const { width, height } = this.canvas;
    const bounds = { minX: 20, maxX: width - 20 };
    const groundY = this.stage.groundY || 470;

    // Handle Match State (Intro countdown, Fighting, KO)
    if (this.matchState === 'intro') {
      this.introTimer--;
      if (this.introTimer <= 0) {
        this.matchState = 'fighting';
      }
    }

    // Timer countdown during active fight
    if (this.matchState === 'fighting') {
      this.timerAcc++;
      if (this.timerAcc >= 60) { // Approx 1 second
        this.timerAcc = 0;
        this.matchTimer = Math.max(0, this.matchTimer - 1);
        if (this.matchTimer === 0) {
          this.handleTimeUp();
        }
      }
    }

    // Input Handling (Player 1 vs Player 2 or AI)
    if (this.matchState === 'fighting') {
      this.p1.handleInput(this.keys, this.p2);

      if (this.mode === 'ai') {
        this.aiController.update(this.p2, this.p1, groundY, bounds);
      } else {
        this.p2.handleInput(this.keys, this.p1);
      }
    }

    // Chakra charge sound control
    if (this.p1.isCharging || this.p2.isCharging) {
      audioManager.startChakraLoop();
    } else {
      audioManager.stopChakraLoop();
    }

    // Update Players
    this.p1.update(groundY, bounds, this.particles);
    this.p2.update(groundY, bounds, this.particles);

    // Check Collisions (P1 attacking P2)
    const hitOnP2 = Collision.checkHit(this.p1, this.p2);
    if (hitOnP2) {
      const hitRes = this.p2.takeDamage(hitOnP2);
      if (hitRes && hitRes.blocked) {
        this.screenShake = 3;
        this.particles.createGuardSparks(hitOnP2.impactX, hitOnP2.impactY);
      } else {
        this.screenShake = hitOnP2.screenShake;
        this.particles.createHitSparks(hitOnP2.impactX, hitOnP2.impactY, 14, '#fef08a');
        if (hitOnP2.damage > 15) {
          this.particles.createShockwave(hitOnP2.impactX, hitOnP2.impactY, this.p1.config.chakraColor, 65);
        }
      }
    }

    // Check Collisions (P2 attacking P1)
    const hitOnP1 = Collision.checkHit(this.p2, this.p1);
    if (hitOnP1) {
      const hitRes = this.p1.takeDamage(hitOnP1);
      if (hitRes && hitRes.blocked) {
        this.screenShake = 3;
        this.particles.createGuardSparks(hitOnP1.impactX, hitOnP1.impactY);
      } else {
        this.screenShake = hitOnP1.screenShake;
        this.particles.createHitSparks(hitOnP1.impactX, hitOnP1.impactY, 14, '#c084fc');
        if (hitOnP1.damage > 15) {
          this.particles.createShockwave(hitOnP1.impactX, hitOnP1.impactY, this.p2.config.chakraColor, 65);
        }
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake--;
    }

    // Particles Update
    this.particles.updateAmbient(width, height);
    this.particles.update();

    // Check for KO
    if (this.matchState === 'fighting') {
      if (this.p1.isDead || this.p2.isDead) {
        this.matchState = 'ko';
        this.winner = this.p1.isDead && this.p2.isDead ? 'draw' : this.p1.isDead ? this.p2 : this.p1;
      }
    } else if (this.matchState === 'ko') {
      this.koTimer--;
      if (this.koTimer <= 0) {
        this.matchState = 'gameover';
        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver(this.winner);
        }
      }
    }

    // Emit HUD stats
    if (this.callbacks.onHudUpdate) {
      this.callbacks.onHudUpdate({
        p1Hp: this.p1.hp,
        p1Cp: this.p1.cp,
        p2Hp: this.p2.hp,
        p2Cp: this.p2.cp,
        timer: this.matchTimer,
        matchState: this.matchState,
        mode: this.mode,
        difficulty: this.difficulty
      });
    }
  }

  handleTimeUp() {
    this.matchState = 'ko';
    if (this.p1.hp > this.p2.hp) {
      this.winner = this.p1;
      this.p2.isDead = true;
    } else if (this.p2.hp > this.p1.hp) {
      this.winner = this.p2;
      this.p1.isDead = true;
    } else {
      this.winner = 'draw';
    }
    audioManager.playKO();
  }

  render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.save();

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const shakeMagnitude = this.screenShake * 1.5;
      const shakeX = (Math.random() - 0.5) * shakeMagnitude;
      const shakeY = (Math.random() - 0.5) * shakeMagnitude;
      ctx.translate(shakeX, shakeY);
    }

    // Clear Canvas
    ctx.clearRect(-20, -20, width + 40, height + 40);

    // 1. Draw Stage Background
    if (this.bgLoaded && this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, width, height);
    } else {
      // Fallback stylized dark sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Stone Arena Ground Overlay (adds depth & shadow)
    const groundY = this.stage.groundY || 470;
    const groundHeight = height - groundY;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
    groundGrad.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, groundHeight);

    // Ground accent rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // 3. Render Characters
    this.p1.render(ctx, this.showDebugBoxes);
    this.p2.render(ctx, this.showDebugBoxes);

    // 4. Render Particles & Visual FX
    this.particles.render(ctx);

    // 5. Render Match State Announcements (FIGHT, KO)
    if (this.matchState === 'intro') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (this.introTimer > 35) {
        ctx.font = '900 68px "Bebas Neue", sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 20;
        ctx.fillText('READY...', width / 2, height / 2 - 20);
      } else {
        ctx.font = '900 84px "Bebas Neue", sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 25;
        ctx.fillText('FIGHT!', width / 2, height / 2 - 20);
      }
      ctx.restore();
    } else if (this.matchState === 'ko') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 96px "Bebas Neue", sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 30;
      ctx.fillText('K.O.!', width / 2, height / 2 - 30);
      ctx.restore();
    }

    ctx.restore();
  }
}
